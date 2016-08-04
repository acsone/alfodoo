# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import os
import time
from cmislib import CmisClient
from cmislib.browser.binding import BrowserBinding
from cmislib.exceptions import \
                          ObjectNotFoundException, \
                          CmisException, \
                          NotSupportedException
                          
import openerp.tests.common as common
from ..controllers import cmis


TEST_DIR = os.path.dirname(os.path.abspath(__file__))

def isInResultSet(resultSet, targetDoc):
    """
    Util function that searches a :class:`ResultSet` for a specified target
    object. Note that this function will do a getNext on every page of the
    result set until it finds what it is looking for or reaches the end of
    the result set. For every item in the result set, the properties
    are retrieved. Long story short: this could be an expensive call.
    """
    done = False
    while not done:
        if resultSet.hasObject(targetDoc.getObjectId()):
            return True
        if resultSet.hasNext():
            resultSet.getNext()
        else:
            done = True


class BaseTestCmisProxy(common.HttpCase):
   
    def setUp(self):
        super(BaseTestCmisProxy, self).setUp()
        cmis_location = os.environ.get('CMIS_LOCATION') or 'http://10.7.20.179:8080/alfresco/api/-default-/public/cmis/versions/1.1/browser/'
        cmis_user = os.environ.get('CMIS_USER') or 'admin'
        cmis_pwd = os.environ.get('CMIS_PWD') or 'admin'
        self.cmis_test_root_path = os.environ.get('CMIS_ROOT') or '/Odoo_proxy'
        if not cmis_location or not cmis_user or not cmis_pwd:
            self.skipTest("To run these tests you must provide the following "
                          "env var: CMIS_LOCATION, CMIS_USER, CMIS_PWD")
        cmis_backend = self.env['cmis.backend']
        cmis_backend.search([(1, '=', 1)]).unlink()
        cmis_backend.create({
            'name' : 'TEST_CMIS_PROXY',
            'location': cmis_location,
            'is_cmis_proxy': True,
            'username': cmis_user,
            'password': cmis_pwd,
            'version': '1.0'
        })
        self.authenticate('admin', 'admin')
        url = 'http://%s:%d%s?db=%s' % (common.HOST, common.PORT,
                                  cmis.CMIS_PROXY_PATH, common.get_db_name())
        self.cmis_url = 'http://%s:%d%s' % (common.HOST, common.PORT,
                                            cmis.CMIS_PROXY_PATH)
        self.headers = {'Cookie': 'session_id=%s' % self.session_id}
        self.cmis_client = CmisClient(self.cmis_url, 'admin', 'admin',
                                      headers=self.headers)
        self.cmis_client.binding = BrowserBinding(headers=self.headers)


class BaseTestCmisClient(BaseTestCmisProxy):

    def setUp(self):
        super(BaseTestCmisClient, self).setUp()
        self.repo = self.cmis_client.getDefaultRepository()
        self.root_folder = self.repo.getRootFolder()
        self.folder_name = " ".join(['web_cmis_viewer_proxy',
                                     self.__class__.__name__,
                                     str(time.time())])
        self.test_folder = self.root_folder.createFolder(self.folder_name)
        self.test_doc1 = os.path.join(TEST_DIR, 'test_doc1.pdf')
        self.test_doc2 = os.path.join(TEST_DIR, 'test_doc2.pdf') 
        

    def tearDown(self):
        """ Clean up after the test. """
        try:
            self.test_folder.deleteTree()
        except NotSupportedException:
            print "Couldn't delete test folder because deleteTree is not supported"
        super(BaseTestCmisClient, self).tearDown()


class TestCmisClient(BaseTestCmisProxy):


    def testGetRepositories(self):
        """Call getRepositories and make sure at least one comes back with
        an ID and a name
        """
        repo_info = self.cmis_client.getRepositories()
        self.assert_(len(repo_info) >= 1)
        self.assert_('repositoryId' in repo_info[0])
        self.assert_('repositoryName' in repo_info[0])

    def testDefaultRepository(self):
        """Get the default repository by calling the repo's service URL
        and check that the repository url is the one of the proxy"""
        repo = self.cmis_client.getDefaultRepository()
        self.assert_(repo is not None)
        self.assert_(repo.getRepositoryId() is not None)
        self.assertEqual(repo.getRepositoryUrl(), 
                         self.cmis_url)


class TestCmisQuery(BaseTestCmisClient):

    def setUp(self):
        super(TestCmisQuery, self).setUp()
        with open(self.test_doc1, 'rb') as test_file:
            self.filename = os.path.basename(test_file.name)
            self.cmis_content = self.test_folder.createDocument(
                    self.filename, contentFile=test_file)

    def testSimpleSelect(self):
        """Execute simple select from cmis:document"""
        query = ("SELECT * FROM cmis:document where cmis:name = '%s'" %
                 self.filename)
        rs = self.repo.query(query)
        self.assertTrue(isInResultSet(rs, self.cmis_content))


class TestRepository(BaseTestCmisClient):

    def testCreateDoc(self):
        with open(self.test_doc1, 'rb') as test_file:
            filename = os.path.basename(test_file.name)
            cmis_content = self.test_folder.createDocument(
                    filename, contentFile=test_file)
            self.assertEqual(cmis_content.getName(), filename)

    def testCreateDocumentSpecialChar(self):
        with open(self.test_doc1, 'rb') as test_file:
            filename = u"ééé.pdf"
            cmis_content = self.test_folder.createDocument(
                    filename, contentFile=test_file)
            self.assertEqual(cmis_content.getName(), filename)


