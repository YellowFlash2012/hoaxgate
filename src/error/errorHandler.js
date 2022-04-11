const errorHandler = (err, req, res, next) => {
    const { status, message, errors } = err;

    let validationErrors;

    if (errors) {
    validationErrors = {};

    errors.forEach((error) => (validationErrors[error.param] = error.msg));
    }

    res.status(status).send({
        path: req.originalUrl,
        timestamp: new Date().getTime(),
        message: 'An error ocurred!',
        validationErrors
    });
};

export default errorHandler