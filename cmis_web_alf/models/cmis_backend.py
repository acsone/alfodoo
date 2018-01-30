# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).


from cmislib.browser.binding import safe_urlencode
from openerp import api, models


class CmisBackend(models.Model):

    _inherit = 'cmis.backend'

    @api.model
    def _get_web_description(self, record):
        """ Return the desciption of backend record to be included into the
        field description of cmis fields that reference the backend.
        """
        descr = super(CmisBackend, self)._get_web_description(record)
        descr.update({
            'share_location': record.share_location,
            'alfresco_api_location': record.alfresco_api_location
        })
        return descr

    @api.multi
    def get_content_details_url(self, cmis_objectid):
        """Return the url to the page into Alfresco Share
        displaying the content details
        """
        self.ensure_one()
        repo = self.get_cmis_repository()
        properties = repo.getObject(cmis_objectid).getProperties()
        return self.get_content_details_url_from_props(properties)

    @api.multi
    def get_content_details_url_from_props(self, properties):
        self.ensure_one()
        details_type = 'document-details'
        if properties['cmis:baseTypeId'] == 'cmis:folder':
            paths = properties['cmis:path']
            if paths:
                path = paths
                if isinstance(paths, list):
                    paths = paths[0]
                params = {'filter': 'path|%s' % path}
                url = ('%s/page/repository#' % self.share_location +
                       safe_urlencode(params))
                return url
            details_type = 'folder-details'
        noderef = properties['alfcmis:nodeRef']
        url = "%s/page/%s?nodeRef=%s" % (self.share_location,
                                         details_type,
                                         noderef)
        return url
