'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = function (app) {
  // In‑memory storage: { [project]: [ issue, ... ] }
  const db = {};

  // Helper to get or init a project's issue array
  function issuesFor(project) {
    if (!db[project]) db[project] = [];
    return db[project];
  }

  app.route('/api/issues/:project')

    // GET: list (and optionally filter) all issues for a project
    .get((req, res) => {
      const project = req.params.project;
      let issues = issuesFor(project);

      // Apply any query filters
      const filters = req.query;
      if (Object.keys(filters).length) {
        issues = issues.filter(issue => {
          return Object.entries(filters).every(([k, v]) => {
            // special case for open (string → boolean)
            if (k === 'open') return String(issue.open) === v;
            return String(issue[k]) === v;
          });
        });
      }

      return res.json(issues);
    })

    // POST: create a new issue
    .post((req, res) => {
      const project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      // required fields
      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const now = new Date().toISOString();
      const newIssue = {
        _id: uuidv4(),
        issue_title,
        issue_text,
        created_by,
        assigned_to: assigned_to || '',
        status_text: status_text || '',
        created_on: now,
        updated_on: now,
        open: true
      };

      issuesFor(project).push(newIssue);
      return res.json(newIssue);
    })

    // PUT: update one or more fields of an issue
    .put((req, res) => {
      const project = req.params.project;
      const { _id, issue_title, issue_text, created_by, assigned_to, status_text, open } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      // collect provided updates
      const updates = {};
      if (issue_title) updates.issue_title = issue_title;
      if (issue_text)  updates.issue_text  = issue_text;
      if (created_by)  updates.created_by  = created_by;
      if (assigned_to) updates.assigned_to = assigned_to;
      if (status_text) updates.status_text = status_text;
      if (open !== undefined) updates.open = open === 'false' ? false : true;

      if (Object.keys(updates).length === 0) {
        return res.json({ error: 'no update field(s) sent', _id });
      }

      const issue = (issuesFor(project)).find(i => i._id === _id);
      if (!issue) {
        return res.json({ error: 'could not update', _id });
      }

      Object.assign(issue, updates, { updated_on: new Date().toISOString() });
      return res.json({ result: 'successfully updated', _id });
    })

    // DELETE: remove an issue by _id
    .delete((req, res) => {
      const project = req.params.project;
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      const arr = issuesFor(project);
      const idx = arr.findIndex(i => i._id === _id);
      if (idx === -1) {
        return res.json({ error: 'could not delete', _id });
      }

      arr.splice(idx, 1);
      return res.json({ result: 'successfully deleted', _id });
    });
};
