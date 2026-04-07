const express = require('express');
const todoModel = require('../models/todo');
const {
  validateCreateTodo,
  validateUpdateTodo,
  validateTodoId,
  validateListQuery,
} = require('../middleware/validators');
const config = require('../config');

const router = express.Router();

router.get('/todos', validateListQuery, (req, res) => {
  try {
    const {
      page = config.pagination.defaultPage,
      limit = config.pagination.defaultLimit,
      sort = 'created_at',
      order = 'DESC',
      completed,
      priority,
      search,
      tag,
    } = req.query;

    const filter = {};
    if (completed !== undefined) filter.completed = completed === 'true';
    if (priority) filter.priority = priority;
    if (search) filter.search = search;
    if (tag) filter.tag = tag;

    const result = todoModel.findAll({
      page: parseInt(page, 10),
      limit: Math.min(parseInt(limit, 10), config.pagination.maxLimit),
      sort,
      order,
      filter,
    });

    res.json({
      success: true,
      data: result.todos,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch todos' },
    });
  }
});

router.get('/todos/stats', (_req, res) => {
  try {
    const stats = todoModel.getStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: { code: 'STATS_ERROR', message: 'Failed to fetch stats' },
    });
  }
});

router.get('/todos/:id', validateTodoId, (req, res) => {
  try {
    const todo = todoModel.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Todo not found' },
      });
    }
    res.json({ success: true, data: todo });
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_ERROR', message: 'Failed to fetch todo' },
    });
  }
});

router.post('/todos', validateCreateTodo, (req, res) => {
  try {
    const { title, description, priority, tags, due_date } = req.body;
    const todo = todoModel.create({ title, description, priority, tags, due_date });

    res.status(201).json({ success: true, data: todo });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_ERROR', message: 'Failed to create todo' },
    });
  }
});

router.put('/todos/:id', validateUpdateTodo, (req, res) => {
  try {
    const { title, description, completed, priority, tags, due_date } = req.body;
    const todo = todoModel.update(req.params.id, {
      title,
      description,
      completed,
      priority,
      tags,
      due_date,
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Todo not found' },
      });
    }

    res.json({ success: true, data: todo });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update todo' },
    });
  }
});

router.patch('/todos/:id/toggle', validateTodoId, (req, res) => {
  try {
    const todo = todoModel.toggleComplete(req.params.id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Todo not found' },
      });
    }
    res.json({ success: true, data: todo });
  } catch (error) {
    console.error('Error toggling todo:', error);
    res.status(500).json({
      success: false,
      error: { code: 'TOGGLE_ERROR', message: 'Failed to toggle todo' },
    });
  }
});

router.delete('/todos/:id', validateTodoId, (req, res) => {
  try {
    const todo = todoModel.delete(req.params.id);
    if (!todo) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Todo not found' },
      });
    }
    res.json({ success: true, data: todo, message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete todo' },
    });
  }
});

router.delete('/todos', (_req, res) => {
  try {
    const result = todoModel.deleteCompleted();
    res.json({
      success: true,
      data: result,
      message: `Deleted ${result.deleted} completed todo(s)`,
    });
  } catch (error) {
    console.error('Error deleting completed todos:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete completed todos' },
    });
  }
});

module.exports = router;
