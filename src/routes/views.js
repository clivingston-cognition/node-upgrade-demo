const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  res.render('index', {
    title: 'TODO List App',
  });
});

module.exports = router;
