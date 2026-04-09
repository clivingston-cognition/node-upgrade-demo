const express = require('express');
const { DataTable, Badge } = require('test-component-library');
const todoModel = require('../models/todo');

const router = express.Router();

router.get('/', (_req, res) => {
  res.render('index', {
    title: 'TODO List App',
  });
});

router.get('/table', (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const allowedSorts = ['created_at', 'updated_at', 'title', 'priority', 'due_date'];
    const sort = allowedSorts.includes(req.query.sort) ? req.query.sort : 'created_at';
    const order = ['ASC', 'DESC'].includes(String(req.query.order || '').toUpperCase()) ? String(req.query.order).toUpperCase() : 'DESC';

    const result = todoModel.findAll({
      page,
      limit: 20,
      sort,
      order,
    });

    const stats = todoModel.getStats();

    const priorityVariants = {
      urgent: 'danger',
      high: 'warning',
      medium: 'primary',
      low: 'default',
    };

    const tableHtml = DataTable({
      id: 'todo-table',
      columns: [
        { key: 'title', label: 'Title', sortable: true },
        { key: 'priority', label: 'Priority', sortable: true },
        { key: 'status', label: 'Status' },
        { key: 'due_date', label: 'Due Date', sortable: true },
        { key: 'tags', label: 'Tags' },
        { key: 'created_at', label: 'Created', sortable: true },
      ],
      rows: result.todos.map((todo) => ({
        title: todo.title,
        priority: todo.priority,
        status: todo.completed ? 'Completed' : 'Pending',
        due_date: todo.due_date || '',
        tags: (todo.tags || []).join(', '),
        created_at: todo.created_at ? todo.created_at.split('T')[0] : '',
        _raw: todo,
      })),
      sort: { key: sort, order },
      striped: true,
      hoverable: true,
      bordered: true,
      emptyMessage: 'No todos yet. Create one from the Card View!',
      cellRenderer: (value, row, col) => {
        if (col.key === 'priority') {
          return Badge({
            text: value,
            variant: priorityVariants[value] || 'default',
          });
        }
        if (col.key === 'status') {
          return Badge({
            text: value,
            variant: row._raw.completed ? 'success' : 'warning',
          });
        }
        if (col.key === 'tags' && value) {
          return value.split(', ').map((tag) =>
            Badge({ text: tag, variant: 'primary' }),
          ).join(' ');
        }
        if (col.key === 'due_date' && value) {
          const isOverdue = !row._raw.completed && new Date(value) < new Date();
          const formatted = new Date(value).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          });
          return isOverdue
            ? '<span style="color: var(--color-danger); font-weight: 500;">' + formatted + '</span>'
            : formatted;
        }
        // Escape HTML for other cells
        if (typeof value !== 'string') return '';
        return value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      },
    });

    const tableStyles = [DataTable.getStyles(), Badge.getStyles()].join('\n');

    res.render('table', {
      title: 'TODO List - Table View',
      tableHtml,
      tableStyles,
      stats,
      pagination: result.pagination,
      sort,
      order,
    });
  } catch (error) {
    console.error('Error rendering table view:', error);
    res.status(500).render('error', {
      title: 'Error',
      status: 500,
      message: 'Failed to load table view',
    });
  }
});

module.exports = router;
