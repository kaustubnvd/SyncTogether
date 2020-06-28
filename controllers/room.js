exports.createRoom = (req, res) => {
  res.redirect(req.body.room);
};

exports.joinRoom = (req, res) => {
  res.send(`Welcome to ${req.params.room}`);
};