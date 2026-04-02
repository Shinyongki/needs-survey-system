const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/agencies',   require('./routes/agencies'));
app.use('/api/sessions',   require('./routes/surveys'));
app.use('/api/responses',  require('./routes/responses'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/participants',  require('./routes/participants'));
app.use('/api/questions',    require('./routes/questions'));
app.use('/api/trends',     require('./routes/trends'));
app.use('/api/compare',    require('./routes/compare'));
app.use('/api/linkage',    require('./routes/linkage'));
app.use('/api/analysis',   require('./routes/analysis'));

app.listen(3001, () => console.log('서버 실행: http://localhost:3001'));
