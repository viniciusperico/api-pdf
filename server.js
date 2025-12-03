const express = require('express');


doc.font('Helvetica');
itens.forEach(item => {
px = 50;
const vals = [item.nome || '-', item.quantidade || 0, (item.valorUnitario ?? 0).toFixed(2), (item.desconto ?? 0).toFixed(2), (item.imposto ?? 0).toFixed(2), (item.total ?? 0).toFixed(2)];
vals.forEach(v => { doc.text(String(v), px); px += 80; });
doc.moveDown(0.5);
});


const valorTotal = itens.reduce((s, it) => s + (it.total || 0), 0);
doc.moveDown(1);
doc.font('Helvetica-Bold').text(`VALOR TOTAL DO ORÇAMENTO: R$ ${valorTotal.toFixed(2)}`, 50);


streamPDF(res, doc, `Orcamento_${(orc.clienteNome||'cliente')}.pdf`);
});


// Endpoint: Relatório (gera tabela simples)
app.post('/api/relatorio', (req, res) => {
const { title = 'relatorio', dados = [] } = req.body || {};
const doc = new PDFDocument({ size: 'A4', margin: 40 });


doc.fontSize(14).text(title, { align: 'left' });
doc.moveDown(1);


if (dados && dados.length) {
// header
const keys = Object.keys(dados[0]);
let x = 50;
doc.font('Helvetica-Bold');
keys.forEach(k => { doc.text(k, x); x += 120; });
doc.moveDown(0.8);


doc.font('Helvetica');
dados.forEach(r => {
let px = 50;
keys.forEach(k => { doc.text(String(r[k] ?? ''), px); px += 120; });
doc.moveDown(0.6);
});
} else {
doc.font('Helvetica').text('Sem dados para exibir.');
}


streamPDF(res, doc, `${title}.pdf`);
});


// Health check
app.get('/', (req, res) => res.send('PDF API OK'));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
