# Copyright 2020 ACSONE SA/NV
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl).
import logging

_logger = logging.getLogger(__name__)


def pre_init_hook(cr):
    _logger.info(
        "Adds a value for alfresco_api_location for all cmis.backend"
    )
    cr.execute(
        """
        ALTER TABLE cmis_backend
        ADD COLUMN IF NOT EXISTS alfresco_api_location VARCHAR
        """
    )
    cr.execute(
        """
        UPDATE cmis_backend
        SET alfresco_api_location='x'
        WHERE alfresco_api_location IS NULL
        """
    )
