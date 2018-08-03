# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import json
import logging
import urlparse
import werkzeug

from odoo import _, http
from odoo.http import request
from odoo.exceptions import AccessError
from odoo.addons.web.controllers import main

_logger = logging.getLogger(__name__)

try:
    import requests
except ImportError:
    _logger.debug('Cannot `import requests`.')

CMIS_PROXY_PATH = '/cmis/1.1/browser'

READ_ACCESS_CMIS_ACTIONS = set([
    "query",
])

WRITE_ACCESS_CMIS_ACTIONS = set([
    "createRelationship",
    # "createPolicy", method at repository level:  not supported
    # "createItem", method at repository level:  not supported
    "bulkUpdate",
    # "createType", method at repository level:  not supported
    # "updateType", method at repository level:  not supported
    "createDocument",
    "createFolder",
    "createDocumentFromSource",
    # "createPolicy", method at repository level:  not supported
    "update",
    "setContent",
    "checkOut",
    "cancelCheckOut",
    "checkIn",
    # "applyPolicy", method at repository level:  not supported
    # "applyACL", method at repository level:  not supported
])

UNLINK_ACCESS_CMIS_ACTIONS = set([
    "delete",
    "deleteContent",
    "removeObjectFromFolder",
    # "removePolicy", method at repository level:  not supported
    # "deleteType", method at repository level:  not supported
])

READ_ACCESS_ALLOWABLE_ACTIONS = set([
    "canGetDescendants",
    "canGetChildren",
    "canGetFolderParent",
    "canGetObjectParents",
    "canGetProperties",
    "canGetContentStream",
    "canGetAllVersions",
    "canGetObjectRelationships",
    "canGetAppliedPolicies",
    "canGetACL",
])

WRITE_ACCESS_ALLOWABLE_ACTIONS = set([
    "canCreateDocument",
    "canCreateFolder",
    # "canCreatePolicy",
    "canCreateRelationship",
    "canUpdateProperties",
    "canMoveObject",
    "canSetContentStream",
    "canAddObjectToFolder",
    "canCheckOut",
    "canCancelCheckOut",
    "canCheckIn",
    # "canApplyPolicy",
    # "canApplyACL",
])

UNLINK_ACCESS_ALLOWABLE_ACTIONS = set([
    "canRemoveObjectFromFolder",
    "canDeleteObject",
    "canDeleteContentStream",
    "canDeleteTree",
    # "canRemovePolicy",
])

CMSI_ACTIONS_OPERATION_MAP = {}
for a in READ_ACCESS_CMIS_ACTIONS:
    CMSI_ACTIONS_OPERATION_MAP[a] = 'read'
for a in WRITE_ACCESS_CMIS_ACTIONS:
    CMSI_ACTIONS_OPERATION_MAP[a] = 'write'
for a in UNLINK_ACCESS_CMIS_ACTIONS:
    CMSI_ACTIONS_OPERATION_MAP[a] = 'unlink'


def gen_dict_extract(key, var):
    """ This method is used to recusrively find into a json structure (dict)
    all values of a given key
    credits: http://stackoverflow.com/questions/9807634/
    find-all-occurences-of-a-key-in-nested-python-dictionaries-and-lists
    """
    if hasattr(var, 'iteritems'):
        for k, v in var.iteritems():
            if k == key:
                yield v
            if isinstance(v, dict):
                for result in gen_dict_extract(key, v):
                    yield result
            elif isinstance(v, list):
                for d in v:
                    for result in gen_dict_extract(key, d):
                        yield result


class CmisProxy(http.Controller):
    @property
    def _cmis_proxy_base_url(self):
        return urlparse.urljoin(request.httprequest.host_url, CMIS_PROXY_PATH)

    @classmethod
    def _clean_url_in_dict(cls, values, original, new):
        """Replace all occurences of the CMIS container url in the json
        returned by a call to the CMIS container by the one of the proxy"""
        if original.endswith('/'):
            original = original[:-1]
        for k, v in values.iteritems():
            if isinstance(v, dict):
                cls._clean_url_in_dict(v, original, new)
            elif hasattr(v, 'replace'):
                values[k] = v.replace(original, new)

    def _check_access_operation(self, model_inst, operation):
        """
        Check if the user has the appropriate rights to perform the operation.
        The default is to check the access rights and access rules on the
        model instance. This behaviour can be adapted by defining the method
        ''_check_cmis_access_operation'' on the model.
        ::
            @api.multi
            def _check_cmis_access_operation(self, operation, field_name=None):
                if my_true_condition:
                    return 'allow'
                if my_false_condition:
                     return 'deny'
                return 'default'

        The expected result must be in ('allow', 'deny', 'default').
        * allow: Access granted
        * deny: Access Denied
        * default: The current method will check the access rights and access
                   rules
        """
        try:
            if hasattr(model_inst, '_check_cmis_access_operation'):
                res = model_inst._check_cmis_access_operation(operation, None)
                if res not in ('allow', 'deny', 'default'):
                    raise ValueError("_check_cmis_access_operation result "
                                     "must be in ('allow', 'deny', 'default')")
                if res != 'default':
                    return res == 'allow'
            model_inst.check_access_rights(operation)
            model_inst.check_access_rule(operation)
        except AccessError:
            return False
        return True

    def _apply_permissions_mapping(self, value, headers, proxy_info,
                                   model_inst=None):
        """This method modify the defined allowableActions returned by the
        CMIS container to apply the Odoo operation policy defined of the
        model instance
        """
        if not model_inst:
            return
        all_allowable_actions = [aa for aa in gen_dict_extract(
            'allowableActions', value)]
        if not all_allowable_actions:
            return
        can_read = self._check_access_operation(model_inst, 'read')
        can_write = self._check_access_operation(model_inst, 'write')
        can_unlink = self._check_access_operation(model_inst, 'unlink')
        for allowable_actions in all_allowable_actions:
            for action, val in allowable_actions.items():
                allowed = False
                if action in READ_ACCESS_ALLOWABLE_ACTIONS:
                    allowed = can_read and val
                elif action in WRITE_ACCESS_ALLOWABLE_ACTIONS:
                    allowed = can_write and val
                elif action in UNLINK_ACCESS_ALLOWABLE_ACTIONS:
                    allowed = can_unlink and val
                allowable_actions[action] = allowed

    def _sanitize_headers(self, headers):
        for key in headers:
            if key.lower() == 'transfer-encoding':
                headers[key] = None

    def _prepare_json_response(self, value, headers, proxy_info,
                               model_inst=None):
        cmis_location = proxy_info['location']
        self._clean_url_in_dict(value,
                                urlparse.urlparse(cmis_location).geturl(),
                                proxy_info['proxy_location'])
        if proxy_info['apply_odoo_security']:
            self._apply_permissions_mapping(
                value, headers, proxy_info, model_inst)
        self._sanitize_headers(headers)
        response = werkzeug.Response(
            json.dumps(value), mimetype='application/json',
            headers=headers)
        return response

    @classmethod
    def _get_redirect_url(cls, proxy_info, url_path):
        cmis_location = proxy_info['location']
        return urlparse.urljoin(cmis_location, url_path)

    def _forward_get_file(self, url, proxy_info, params):
        """Method called to retrieved the content associated to a CMIS object.
        The content is streamed between the CMIS container and the caller to
        avoid to suck the server memory
        :return: :class:`Response <Response>` object
        :rtype: werkzeug.Response
        """
        r = requests.get(
            url, params=params,
            stream=True,
            auth=(proxy_info['username'], proxy_info['password']))
        r.raise_for_status()
        headers = dict(r.headers.items())
        self._sanitize_headers(headers)
        return werkzeug.Response(
            r, headers=headers,
            direct_passthrough=True)

    def _forward_get(self, url_path, proxy_info, model_inst, params):
        """
        :return: :class:`Response <Response>` object
        :rtype: werkzeug.Response
        """
        url = self._get_redirect_url(proxy_info, url_path)
        if params.get('cmisselector') == 'content':
            return self._forward_get_file(url, proxy_info, params)
        r = requests.get(
            url, params=params,
            auth=(proxy_info['username'], proxy_info['password']))
        r.raise_for_status()
        if r.text:
            return self._prepare_json_response(
                r.json(), dict(r.headers.items()), proxy_info, model_inst)
        else:
            response = werkzeug.Response()
        return response

    def _forward_post(self, url_path, proxy_info, model_inst, params):
        """The CMIS Browser binding is designed to be queried from the browser
        Therefore, the parameters in a POST are expected to be submitted as
        HTTP multipart forms. Therefore each parameter in the request is
        forwarded as a part of a multipart/form-data.
        :return: :class:`Response <Response>` object
        :rtype: werkzeug.Response
        """
        files = {}
        if 'content' in params:
            # we are in a mulitpart form data'
            content = params.pop('content')
            files['content'] = (
                content.filename,
                content.stream,
                content.mimetype
            )
        for k, v in params.iteritems():
            # no filename for parts dedicated to HTTP Form data
            files[k] = (None, v, 'text/plain;charset=utf-8')
        url = self._get_redirect_url(proxy_info, url_path)
        r = requests.post(url, files=files,
                          auth=(
                              proxy_info['username'], proxy_info['password']))
        r.raise_for_status()
        if r.text:
            return self._prepare_json_response(
                r.json(), dict(r.headers.items()), proxy_info, model_inst)
        else:
            response = werkzeug.Response()
        return response

    def _check_provided_token(self, cmis_path, proxy_info, params):
        """ Check that a token is present in the request or in the http
        headers and both are equal.
        :return: the token value if checks are OK, False otherwise.
        """
        token = request.httprequest.headers.get('Authorization')
        if token:
            token = token.replace('Bearer', '').strip()
        else:
            token = (params.get('token') or '').strip()
        if 'token' in params:
            params.pop('token')
        if not token:
            _logger.info("Tokens not provided in headers or request params")
            return False
        return token

    def _decode_token(self, cmis_path, proxy_info, params,
                      token):
        """Return the Odoo object referenced by the token and the field name
        for which the query is done
        :return: a tuple (Odoo model instance if exists and user has at least
        read access or False, field_name)
        """
        token = json.loads(token)
        model_name = token.get('model')
        false_result = False, False
        res_id = token.get('res_id')
        if model_name not in request.env:
            _logger.info("Invalid model name in token (%s)", model_name)
            return false_result
        model = request.env[model_name]
        if not model.check_access_rights('read', raise_exception=False):
            _logger.info("User has no read access on model %s", model_name)
            return false_result
        model_inst = model.browse(res_id)
        if not model_inst.exists():
            _logger.info("The referenced model doesn't exist or the user has "
                         "no read access (%s, %s)", model, res_id)
            return false_result
        return model_inst, token.get('field_name')

    def _check_cmis_content_access(self, cmis_path, proxy_info, params,
                                   model_inst, field_name):
        """Check that the CMIS content referenced into the request is the
        same as or a child of the one linked to the odoo model instance.
        :return: True if check is Ok False otherwise
        """
        token_cmis_objectid = getattr(model_inst, field_name)
        if not token_cmis_objectid:
            _logger.info("The referenced model doesn't reference a CMIS "
                         "content (%s, %s)", model_inst._name, model_inst.id)
            return False
        request_cmis_objectid = params.get('renderedObjectId')
        if request_cmis_objectid:
            # If the proxy is called to render a cmis content, we need to check
            # the original objectId since the one provided by the rendition
            # service has no paths
            params.pop('renderedObjectId')
        else:
            request_cmis_objectid = params.get('objectId')
        repo = proxy_info['cmis_repository']
        if not request_cmis_objectid:
            # get the CMIS object id from cmis_path
            cmis_content = repo.getObjectByPath(cmis_path)
            request_cmis_objectid = cmis_content.getObjectId()
        if request_cmis_objectid == token_cmis_objectid:
            # the operation is on the CMIS content linked to the Odoo model
            # instance
            return True
        cmis_object = repo.getObject(request_cmis_objectid)
        # We can't use a CMIS query to check if a node is in the expected
        # tree since the indexation is asynchronous. In place of a simple
        # query we check if one of the paths of the node linked to the Odoo
        # content instance is in one of the node paths of the requested
        # cmis_object
        child_paths = cmis_object.getPaths()
        parent_paths = repo.getObject(token_cmis_objectid).getPaths()
        for p in parent_paths:
            for cp in child_paths:
                if p in cp:
                    return True
        _logger.info("%s is not a child of %s", request_cmis_objectid,
                     token_cmis_objectid)
        return False

    def _check_content_action_access(self, cmis_path, proxy_info, params,
                                     model_inst):
        """Check that the User has de required Permissioon on the Odoo model
        instance to di the expected CMIS action
        """
        cmisaction = params.get('cmisaction')
        if not cmisaction:
            return True
        operation = CMSI_ACTIONS_OPERATION_MAP.get(cmisaction)
        if not operation:
            _logger.info("CMIS action %s not supported", cmisaction)
            return False
        if not self._check_access_operation(model_inst, operation):
            _logger.info("User don't have the access right for operation %s "
                         "on %s to execute the CMIS action %s", operation,
                         model_inst.name_get()[0][1], cmisaction)
            return False
        return True

    def _check_access(self, cmis_path, proxy_info, params):
        """This method check that the user can access to the requested CMIS
        content.

        Security checks applied  when the proxy mode is activated,:

        1. Requests from the client must provide a token (in the header or
           as param of the request).
           If no security token is provided in this case, the access is denied.

        2. The Odoo object referenced by the token (the token is build as
           'model.name' + '_' + 'instance_id') must exist.

        3. The user must have read access to the object referenced by the token

        4. If a cmis_path or object_id is provided by the request, the
           referenced CMIS content must be child of or the node referenced by
           the Odoo object from the token (or equal)

        5. If a cmisaction is provided by the request, a check is done to
           ensure that the user has the required privileges in Odoo
        """
        # check token conformity
        token = self._check_provided_token(cmis_path, proxy_info, params)
        if not token:
            raise AccessError(_("Bad request"))
        # check access to object from token
        model_inst, field_name = self._decode_token(
            cmis_path, proxy_info, params, token)
        if not model_inst:
            raise AccessError(_("Bad request"))
        # check if the CMIS object in the request is the the one referenced on
        # model_inst or a child of this one
        if not cmis_path and 'objectId' not in params:
            # The request is not for an identified content
            return model_inst
        if not self._check_cmis_content_access(
                cmis_path, proxy_info, params, model_inst, field_name):
            raise AccessError(_("Bad request"))
        if not self._check_content_action_access(
                cmis_path, proxy_info, params, model_inst):
            raise AccessError(_("Bad request"))
        return model_inst

    @http.route([
        CMIS_PROXY_PATH + '/<int:backend_id>',
        CMIS_PROXY_PATH + '/<int:backend_id>/<path:cmis_path>'
    ], type='http', auth="user", csrf=False, methods=['GET', 'POST'])
    @main.serialize_exception
    def call_cmis_services(self, backend_id, cmis_path="", **kwargs):
        """Call at the root of the CMIS repository. These calls are for
        requesting the global services provided by the CMIS Container
        """
        # proxy_info are informations available into the cache without loading
        # the cmis.backend from the database
        proxy_info = request.env['cmis.backend'].get_proxy_info_by_id(
            backend_id)
        method = request.httprequest.method
        model_inst = False
        if proxy_info.get('apply_odoo_security'):
            model_inst = self._check_access(cmis_path, proxy_info, kwargs)
        if method not in ['GET', 'POST']:
            raise AccessError(
                _("The HTTP METHOD %s is not supported by CMIS") % method)
        if method == 'GET':
            method = self._forward_get
        elif method == 'POST':
            method = self._forward_post
        return method(cmis_path, proxy_info, model_inst, kwargs)
