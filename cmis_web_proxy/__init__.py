import functools

import requests

from odoo.tools import config

from . import models
from . import controllers

try:
    from odoo.addons.server_environment import serv_config

    if serv_config.has_section("cmis_web_proxy_timeout"):
        cmis_timeout = serv_config["cmis_web_proxy_timeout"]
    else:
        cmis_timeout = 10
except ImportError:
    cmis_timeout = config.misc.get("cmis_web_proxy_timeout", 10)


# Set a timeout on requests get and post (default=10s)
requests.get = functools.partial(requests.get, timeout=cmis_timeout)
requests.post = functools.partial(requests.post, timeout=cmis_timeout)
