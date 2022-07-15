import KingWorld from 'kingworld'

import cors from '../src/index'

const app = new KingWorld()
    .use(cors)
    .get('/', () => 'hi')
    .listen(8080)
