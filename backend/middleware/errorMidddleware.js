export function errorHandler(err, req, res, next){
  console.error(err);
  const code = res.statusCode && res.statusCode !==200 ? res.statusCode : 500;
  res.status(code).json({ message: err.message || 'Server error' });
}
