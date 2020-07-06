exports.getHome = (req, res) => {
  res.render('home', { errorMessage: req.flash('error') });
};
