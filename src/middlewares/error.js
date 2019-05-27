error = (err, req, res, next) => {
    //console.log(err);
    return res.status(err.status || 500).send({ msg: err.message || 'Ha ocurrido un error, intentelo de nuevo mas tarde. Si el error persiste comunique con un administrador' });
}

module.exports = error