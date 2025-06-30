const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
chai.use(chaiHttp);

suite('Functional Tests', function() {
  let id1, id2;

  test('1) Create an issue with every field', function(done) {
    chai.request(server)
      .post('/api/issues/test')
      .send({
        issue_title: 'Title1',
        issue_text: 'text1',
        created_by: 'User1',
        assigned_to: 'Assignee1',
        status_text: 'Status1'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, '_id');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'updated_on');
        assert.equal(res.body.issue_title, 'Title1');
        assert.equal(res.body.issue_text, 'text1');
        assert.equal(res.body.created_by, 'User1');
        assert.equal(res.body.assigned_to, 'Assignee1');
        assert.equal(res.body.status_text, 'Status1');
        assert.isTrue(res.body.open);
        id1 = res.body._id;
        done();
      });
  });

  test('2) Create an issue with only required fields', function(done) {
    chai.request(server)
      .post('/api/issues/test')
      .send({
        issue_title: 'Title2',
        issue_text: 'text2',
        created_by: 'User2'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, '_id');
        assert.equal(res.body.issue_title, 'Title2');
        assert.equal(res.body.issue_text, 'text2');
        assert.equal(res.body.created_by, 'User2');
        assert.equal(res.body.assigned_to, '');
        assert.equal(res.body.status_text, '');
        assert.isTrue(res.body.open);
        id2 = res.body._id;
        done();
      });
  });

  test('3) Create an issue with missing required fields', function(done) {
    chai.request(server)
      .post('/api/issues/test')
      .send({
        issue_title: 'NoText'
      })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'required field(s) missing' });
        done();
      });
  });

  test('4) View issues on a project', function(done) {
    chai.request(server)
      .get('/api/issues/test')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        // we created at least 2
        assert.isAtLeast(res.body.length, 2);
        done();
      });
  });

  test('5) View issues on a project with one filter', function(done) {
    chai.request(server)
      .get('/api/issues/test')
      .query({ _id: id1 })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.lengthOf(res.body, 1);
        assert.equal(res.body[0]._id, id1);
        done();
      });
  });

  test('6) View issues on a project with multiple filters', function(done) {
    chai.request(server)
      .get('/api/issues/test')
      .query({ created_by: 'User2', open: 'true' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.lengthOf(res.body, 1);
        assert.equal(res.body[0]._id, id2);
        done();
      });
  });

  test('7) Update one field on an issue', function(done) {
    chai.request(server)
      .put('/api/issues/test')
      .send({ _id: id1, issue_text: 'updated text' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: id1 });
        done();
      });
  });

  test('8) Update multiple fields on an issue', function(done) {
    chai.request(server)
      .put('/api/issues/test')
      .send({ _id: id2, issue_title: 'Updated Title', assigned_to: 'NewAssignee' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully updated', _id: id2 });
        done();
      });
  });

  test('9) Update with missing _id', function(done) {
    chai.request(server)
      .put('/api/issues/test')
      .send({ issue_text: 'no id' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });

  test('10) Update with no update fields', function(done) {
    chai.request(server)
      .put('/api/issues/test')
      .send({ _id: id1 })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'no update field(s) sent', _id: id1 });
        done();
      });
  });

  test('11) Update with invalid _id', function(done) {
    chai.request(server)
      .put('/api/issues/test')
      .send({ _id: 'invalid', issue_text: 'does not matter' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not update', _id: 'invalid' });
        done();
      });
  });

  test('12) Delete with missing _id', function(done) {
    chai.request(server)
      .delete('/api/issues/test')
      .send({})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'missing _id' });
        done();
      });
  });

  test('13) Delete an issue', function(done) {
    chai.request(server)
      .delete('/api/issues/test')
      .send({ _id: id1 })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { result: 'successfully deleted', _id: id1 });
        done();
      });
  });

  test('14) Delete with invalid _id', function(done) {
    chai.request(server)
      .delete('/api/issues/test')
      .send({ _id: 'invalid' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.deepEqual(res.body, { error: 'could not delete', _id: 'invalid' });
        done();
      });
  });
});

