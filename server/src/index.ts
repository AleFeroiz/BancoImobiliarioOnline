const port = Number(process.env.PORT) || 2567
import server from './app.config.js'

await server.listen(port)
console.log(`Banco Imobiliário Online server listening on :${port}`)
