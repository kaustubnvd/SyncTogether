exports.createRoom = (req, res) => {
  res.redirect(req.body.room);
};

exports.joinRoom = (req, res) => {
  res.render('room');
};