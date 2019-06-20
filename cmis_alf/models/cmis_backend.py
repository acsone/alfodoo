# © 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

import requests
from odoo import api, fields, models


class CmisBackend(models.Model):
    _inherit = 'cmis.backend'
    _backend_type = 'cmis'

    @api.multi
    @api.depends('alfresco_api_location')
    def _compute_alf_folder_template_url(self):
        for record in self:
            to_replace = "api"
            if record.alfresco_api_location.endswith('/'):
                to_replace = "api/"
            location = record.alfresco_api_location.replace(
                to_replace,
                "slingshot/doclib/folder-templates"
            )
            record.alf_folder_template_url = location

    share_location = fields.Char(
        string='Alfresco Share Url',
        required=True,
        default='http://localhost:8080/share'
    )

    alfresco_api_location = fields.Char(
        string='Alfresco Api Url',
        required=True,
        default='http://localhost:8080/alfresco/s/api'
    )

    alf_folder_template_url = fields.Char(
        compute='_compute_alf_folder_template_url'
    )

    @api.multi
    def _get_alf_api_auth_params(self):
        """
        Return the parameters to use to make JSON requests to the alfresco api
        :return:
        """
        self.ensure_one()
        return(self.username, self.password)

    @api.multi
    def _get_alf_noderef_from_objectid(self, cmis_objectid):
        """
        Return the nodref from the cmis_objectid
        :param cmis_objectid:
        :return:
        """
        self.ensure_one()
        repo = self.get_cmis_repository()
        cmis_object = repo.getObject(cmis_objectid)
        return cmis_object.properties['alfcmis:nodeRef']

    @api.model
    def _get_cmis_objectid_from_noderef(self, alf_noderef):
        """
        Return the cmis objectid from an alfresco  noderef
        The alfresco noderef looks like
        u'workspace://SpacesStore/1c8007c5-da05-4889-83e1-c8c43dbf4683' The
        last part seems to always be the cmis_objectid
        :param alf_noderef:
        :return:
        """
        return alf_noderef.split('/')[-1]

    @api.multi
    def create_cmis_folder_from_template(self, source_objectid,
                                         parent_objectid, name, title=None,
                                         description=None):
        """Create a new cmis folder from an alfresco space template.
        """
        self.ensure_one()
        payload = {
            "prop_cm_name": name,
            "prop_cm_title": title or "",
            "prop_cm_description": description or "",
            "sourceNodeRef": self._get_alf_noderef_from_objectid(
                source_objectid),
            "parentNodeRef": self._get_alf_noderef_from_objectid(
                parent_objectid)
        }
        r = requests.post(self.alf_folder_template_url, json=payload,
                          auth=self._get_alf_api_auth_params())
        r.raise_for_status()
        resp = r.json()
        if 'persistedObject' in resp:
            # alfresco >= 5.1
            new_noderef = resp['persistedObject']
            return self._get_cmis_objectid_from_noderef(new_noderef)
        # alfresco < 5.1
        # reload new object from path
        cmis_object = self.get_folder_by_path(
            name,
            create_if_not_found=False,
            cmis_parent_objectid=parent_objectid)
        return cmis_object.getObjectId()
