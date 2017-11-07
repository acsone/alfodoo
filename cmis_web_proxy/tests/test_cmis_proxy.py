# -*- coding: utf-8 -*-
# Copyright 2016 ACSONE SA/NV (<http://acsone.eu>)
# License AGPL-3.0 or later (http://www.gnu.org/licenses/agpl.html).
import logging
import os
import time

import odoo.tests.common as common
from cmislib import CmisClient
from cmislib.browser.binding import BrowserBinding
from cmislib.exceptions import \
    NotSupportedException

_logger = logging.getLogger(__name__)


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
        cmis_location = os.environ.get('CMIS_LOCATION') or \
            ('http://10.7.20.179:8080/alfresco/api/-default-'
             '/public/cmis/versions/1.1/browser/')
        cmis_user = os.environ.get('CMIS_USER') or 'admin'
        cmis_pwd = os.environ.get('CMIS_PWD') or 'admin'
        self.cmis_test_root_path = os.environ.get('CMIS_ROOT') or '/Odoo_proxy'
        if not cmis_location or not cmis_user or not cmis_pwd:
            self.skipTest("To run these tests you must provide the following "
                          "env var: CMIS_LOCATION, CMIS_USER, CMIS_PWD")
        cmis_backend = self.env['cmis.backend']
        cmis_backend.search([(1, '=', 1)]).unlink()
        self.cmis_backend = cmis_backend.create({
            'name': 'TEST_CMIS_PROXY',
            'location': cmis_location,
            'is_cmis_proxy': True,
            'apply_odoo_security': False,
            'username': cmis_user,
            'password': cmis_pwd,
            'version': '1.0'
        })
        web_descr = self.cmis_backend.get_web_description()[
            self.cmis_backend.id]
        proxy_path = web_descr['cmis_location']
        self.authenticate('admin', 'admin')
        self.cmis_url = 'http://%s:%d%s' % (common.HOST, common.PORT,
                                            proxy_path)
        self.headers = {'Cookie': 'session_id=%s' % self.session_id}
        self.cmis_client = CmisClient(self.cmis_url, 'admin', 'admin',
                                      headers=self.headers)
        self.cmis_client.binding = BrowserBinding(headers=self.headers)


class BaseTestCmisClient(BaseTestCmisProxy):

    def setUp(self):
        super(BaseTestCmisClient, self).setUp()
        self.repo = self.cmis_client.getDefaultRepository()
        self.root_folder = self.repo.getRootFolder()
        self.folder_name = " ".join(['cmis_web_proxy',
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
            _logger.info('Delete tree failed', exc_info=1)
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
            filename = u"éééà€ß.pdf"
            cmis_content = self.test_folder.createDocument(
                filename, contentFile=test_file)
            self.assertEqual(cmis_content.getName(), filename)

    def testGetObject(self):
        """Create a test folder then attempt to retrieve it as a
        :class:`CmisObject` object using its object ID"""
        folder_name = 'testGetObject folder'
        new_folder = self.repo.createFolder(self.test_folder, folder_name)
        objectId = new_folder.getObjectId()
        cmis_content = self.repo.getObject(objectId)
        self.assertEquals(folder_name, cmis_content.getName())
        new_folder.delete()

    def testReturnVersion(self):
        """Get latest and latestmajor versions of an object"""
        with open(self.test_doc1, 'rb') as test_file:
            filename = os.path.basename(test_file.name)
            props = {'cmis:objectTypeId': 'cmis:document'}
            doc10 = self.test_folder.createDocument(
                filename, contentFile=test_file, properties=props)
        doc10Id = doc10.getObjectId()
        if not doc10.allowableActions['canCheckOut']:
            self.skipTest('The test doc cannot be checked out...skipping')
        pwc = doc10.checkout()
        # checkin a minor version, 1.1
        doc11 = pwc.checkin(major='false', checkinComment='checkin minor')
        if not doc11.allowableActions['canCheckOut']:
            self.skipTest('The test doc cannot be checked out...skipping')
        pwc = doc11.checkout()
        # checkin a major version, 2.0
        doc20 = pwc.checkin(checkinComment='checkin major')
        doc20Id = doc20.getObjectId()
        if not doc20.allowableActions['canCheckOut']:
            self.skipTest('The test doc cannot be checked out...skipping')
        pwc = doc20.checkout()
        # checkin a minor version, 2.1
        doc21 = pwc.checkin(major='false', checkinComment='checkin minor')
        doc21Id = doc21.getObjectId()

        docLatest = self.repo.getObject(doc10Id, returnVersion='latest')
        self.assertEquals(doc21Id, docLatest.getObjectId())

        docLatestMajor = self.repo.getObject(doc10Id,
                                             returnVersion='latestmajor')
        self.assertEquals(doc20Id, docLatestMajor.getObjectId())

    def testMoveDocument(self):
        """Move a Document from one folder to another folder"""
        subFolder1 = self.test_folder.createFolder('sub1')
        doc = subFolder1.createDocument('testdoc1')
        self.assertEquals(len(subFolder1.getChildren()), 1)
        subFolder2 = self.test_folder.createFolder('sub2')
        self.assertEquals(len(subFolder2.getChildren()), 0)
        doc.move(subFolder1, subFolder2)
        self.assertEquals(len(subFolder1.getChildren()), 0)
        self.assertEquals(len(subFolder2.getChildren()), 1)
        self.assertEquals(doc.name, subFolder2.getChildren()[0].name)


class TestFolder(BaseTestCmisClient):

    def testGetChildren(self):
        """Get the children of the test folder"""
        name1 = 'testchild1'
        name2 = 'testchild2'
        sub_name = 'testgrandchild'
        child1 = self.test_folder.createFolder(name1)
        child2 = self.test_folder.createFolder(name2)
        sub_child = child2.createFolder(sub_name)
        rs = self.test_folder.getChildren()
        self.assert_(rs is not None)
        self.assertEquals(2, len(rs.getResults()))
        self.assertTrue(isInResultSet(rs, child1))
        self.assertTrue(isInResultSet(rs, child2))
        self.assertFalse(isInResultSet(rs, sub_child))

    def testDeleteEmptyFolder(self):
        """Create a test folder, then delete it"""
        name = 'testDeleteEmptyFolder folder'
        folder = self.test_folder.createFolder(name)
        self.assertEquals(name, folder.getName())
        newFolder = folder.createFolder('testFolder')
        children = folder.getChildren()
        self.assertEquals(1, len(children.getResults()))
        newFolder.delete()
        children = folder.getChildren()
        self.assertEquals(0, len(children.getResults()))

    def testUpdateProperties(self):
        """Create a test folder, then update its properties"""
        name = 'testUpdateProperties folder'
        folder = self.test_folder.createFolder(name)
        self.assertEquals(name, folder.getName())
        name2 = 'testUpdateProperties folder2'
        props = {'cmis:name': name2}
        folder.updateProperties(props)
        self.assertEquals(name2, folder.getName())


class TestDocument(BaseTestCmisClient):

    def testCheckout(self):
        """Create a document in a test folder, then check it out"""
        new_doc = self.test_folder.createDocument('testDocument')
        if not new_doc.allowableActions['canCheckOut']:
            self.skipTest('The test doc cannot be checked out...skipping')
        private_working_copy = new_doc.checkout()
        try:
            self.assertTrue(new_doc.isCheckedOut())
        finally:
            private_working_copy.delete()

    def testCheckin(self):
        """Create a document in a test folder, check it out, then in"""
        with open(self.test_doc1, 'rb') as test_file:
            filename = os.path.basename(test_file.name)
            props = {'cmis:objectTypeId': 'cmis:document'}
            doc = self.test_folder.createDocument(
                filename, contentFile=test_file, properties=props)
        self.assertEquals(filename, doc.getName())
        if not doc.allowableActions['canCheckOut']:
            self.skipTest('The test doc cannot be checked out...skipping')
        private_working_copy = doc.checkout()
        try:
            self.assertTrue(doc.isCheckedOut())
            doc = private_working_copy.checkin(checkinComment='checkin')
            self.assertFalse(doc.isCheckedOut())
        finally:
            if doc.isCheckedOut():
                private_working_copy.delete()

    def testCancelCheckout(self):
        """Create a document in a test folder, check it out, then cancel
        checkout"""
        new_doc = self.test_folder.createDocument('testDocument')
        if not new_doc.allowableActions['canCheckOut']:
            self.skipTest('The test doc cannot be checked out...skipping')
        private_working_copy = new_doc.checkout()
        try:
            self.assertTrue(new_doc.isCheckedOut())
        finally:
            private_working_copy.delete()
        new_doc.cancelCheckout()
        self.assertFalse(new_doc.isCheckedOut())

    def testDeleteDocument(self):
        """Create a document in a test folder, then delete it"""
        new_doc = self.test_folder.createDocument('testDocument')
        children = self.test_folder.getChildren()
        self.assertEquals(1, len(children.getResults()))
        new_doc.delete()
        children = self.test_folder.getChildren()
        self.assertEquals(0, len(children.getResults()))
