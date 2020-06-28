const express = require('express');
const router = express.Router();

const roomController = require('../controllers/room');

router.post('/room', roomController.createRoom);

router.get('/:room', roomController.joinRoom);

module.exports = router;