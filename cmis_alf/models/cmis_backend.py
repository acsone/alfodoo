# -*- coding: utf-8 -*-
# © 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).

from openerp import api, fields, models


class CmisBackend(models.Model):
    _inherit = 'cmis.backend'
    _backend_type = 'cmis'

    share_location = fields.Char(
        string='Alfresco Share Url',
        required=True)

    alfresco_api_location = fields.Char(
        string='Alfresco Api Url',
        required=True)

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
            details_type = 'folder-details'
        noderef = properties['alfcmis:nodeRef']
        # TODO cmis_alf
        url = "%s/page/%s?nodeRef=%s" % (self.share_location,
                                         details_type,
                                         noderef)
        return url
