const app = require('./config')
try {
    app.listen(app.get('PORT'), () => {
        console.log('Server on port: '+ app.get('PORT'))
    })
} catch (error) {
    console.error(err);
    return process.exit();
}
