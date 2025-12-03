const express = require("express");
const cors = require("cors");
const { jsPDF } = require("jspdf");
require("jspdf-autotable");

const app = express();
app.use(cors());
app.use(express.json());

/* ===============================
   FUNÇÃO PARA FORMATAR DATAS
================================= */
function formatarData(date, diasAdicionar = 0) {
  const novaData = new Date(date);
  novaData.setDate(novaData.getDate() + diasAdicionar);
  const dia = String(novaData.getDate()).padStart(2, "0");
  const mes = String(novaData.getMonth() + 1).padStart(2, "0");
  const ano = novaData.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/* ======================================================
   FUNÇÃO GENÉRICA PARA ENVIAR PDF COMO DOWNLOAD
====================================================== */
function enviarPDF(res, doc, nomeArquivo) {
  const pdfBytes = doc.output("arraybuffer");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
  res.send(Buffer.from(pdfBytes));
}

/* ===============================
   ROTA: NOTA FISCAL
================================= */
app.post("/api/notaFiscal", (req, res) => {
  const venda = req.body;
  const doc = new jsPDF();

  doc.setFillColor(200, 200, 200);
  doc.rect(10, 10, 190, 25, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("NOTA FISCAL ELETRÔNICA - NF-e", 105, 25, { align: "center" });

  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text("MiniERP LTDA", 14, 42);
  doc.text("CNPJ: 12.345.678/0001-99", 14, 48);
  doc.text("Endereço: Av. Brasil, 123 - Ivaiporã - PR", 14, 54);
  doc.text("Telefone: (43) 99999-9999 | Email: minierp@empresa.com", 14, 60);

  doc.line(14, 64, 196, 64);

  doc.setFont("helvetica", "bold");
  doc.text("Destinatário:", 14, 72);

  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${venda.clienteNome}`, 14, 80);
  doc.text(`CPF/CNPJ: ${venda.clienteCPF || "-"}`, 14, 86);
  doc.text(`Endereço: ${venda.clienteEndereco || "-"}`, 14, 92);
  doc.text(`Telefone: ${venda.clienteTelefone || "-"}`, 14, 98);
  doc.text(`Email: ${venda.clienteEmail || "-"}`, 14, 104);

  doc.setFont("helvetica", "bold");
  doc.text("Dados da Operação:", 14, 118);
  doc.setFont("helvetica", "normal");
  doc.text(`Data de Venda: ${venda.data || "-"}`, 14, 126);
  doc.text(`Forma de Pagamento: ${venda.formaPagamento || "-"}`, 14, 132);

  doc.autoTable({
    startY: 140,
    head: [["Produto", "Qtd", "Unitário", "Desconto", "Imposto", "Total"]],
    body: [[
      venda.produto || "-",
      venda.quantidade || 0,
      (venda.valorUnitario ?? 0).toFixed(2),
      (venda.desconto ?? 0).toFixed(2),
      (venda.imposto ?? 0).toFixed(2),
      (venda.valor ?? 0).toFixed(2),
    ]],
    theme: "striped"
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold").setFontSize(12);
  doc.text(`VALOR TOTAL DA NOTA: R$ ${(venda.valor ?? 0).toFixed(2)}`, 14, finalY);

  enviarPDF(res, doc, `NotaFiscal_${venda.clienteNome}.pdf`);
});

/* ===============================
   ROTA: BOLETO
================================= */
app.post("/api/boleto", (req, res) => {
  const venda = req.body;
  const doc = new jsPDF();

  const dataHoje = new Date();
  const dataVenc = formatarData(dataHoje, 15);

  doc.setFont("helvetica", "bold").setFontSize(18);
  doc.text("Banco 001 - Banco IFPR", 14, 20);

  doc.setFont("helvetica", "normal").setFontSize(12);
  doc.text(`Vencimento: ${dataVenc}`, 160, 20);
  doc.text("Agência/Conta: 1234/567890", 14, 30);

  doc.setFont("courier", "bold").setFontSize(14);
  doc.text(
    venda.linhaDigitavel ||
      "34191.79001 01043.510047 91020.150008 7 87670000012345",
    14,
    42
  );

  doc.line(10, 48, 200, 48);

  doc.setFont("helvetica", "bold");
  doc.text("Beneficiário:", 14, 60);
  doc.setFont("helvetica", "normal");
  doc.text("MiniERP LTDA", 14, 66);
  doc.text("CNPJ: 12.345.678/0001-99", 14, 72);

  doc.setFont("helvetica", "bold").text("Pagador:", 14, 86);
  doc.setFont("helvetica", "normal");
  doc.text(`${venda.clienteNome}`, 14, 92);
  doc.text(`CPF/CNPJ: ${venda.clienteCPF}`, 14, 98);
  doc.text(`Endereço: ${venda.clienteEndereco}`, 14, 104);

  doc.setFont("helvetica", "bold");
  doc.text("Valor do Documento:", 150, 92);
  doc.text(`R$ ${(venda.valor ?? 0).toFixed(2)}`, 150, 98);

  doc.setFont("courier", "bold").setFontSize(20);
  doc.text("|||| ||| |||| ||| || ||| ||||| || |||", 14, 160);

  enviarPDF(res, doc, `Boleto_${venda.clienteNome}.pdf`);
});

/* ===============================
   ROTA: ORÇAMENTO
================================= */
app.post("/api/orcamento", (req, res) => {
  const o = req.body;
  const doc = new jsPDF();

  doc.setFillColor(100, 149, 237);
  doc.rect(10, 10, 190, 25, "F");

  doc.setFont("helvetica", "bold").setFontSize(16);
  doc.text("ORÇAMENTO", 105, 25, { align: "center" });

  doc.setFontSize(10).setFont("helvetica", "normal");
  doc.text("MiniERP LTDA", 14, 42);
  doc.text("CNPJ: 12.345.678/0001-99", 14, 48);
  doc.text("Endereço: Av. Brasil, 123 - Ivaiporã - PR", 14, 54);
  doc.text("Telefone: (43) 99999-9999 | Email: minierp@empresa.com", 14, 60);

  doc.line(14, 64, 196, 64);

  doc.setFont("helvetica", "bold").text("Cliente:", 14, 72);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${o.clienteNome}`, 14, 80);
  doc.text(`CPF/CNPJ: ${o.clienteCPF}`, 14, 86);
  doc.text(`Endereço: ${o.clclienteEndereco}`, 14, 92);

  doc.setFont("helvetica", "bold").text("Informações:", 14, 118);
  doc.setFont("helvetica", "normal");
  doc.text(`Data de Emissão: ${o.data}`, 14, 126);
  doc.text(`Validade: ${o.validade}`, 14, 132);

  doc.autoTable({
    startY: 140,
    head: [["Produto", "Qtd", "Unitário", "Desconto", "Imposto", "Total"]],
    body: o.itens.map((i) => [
      i.nome,
      i.quantidade,
      i.valorUnitario.toFixed(2),
      i.desconto.toFixed(2),
      i.imposto.toFixed(2),
      i.total.toFixed(2)
    ]),
    theme: "striped"
  });

  const valorTotal = o.itens.reduce((s, i) => s + Number(i.total), 0);
  const finalY = doc.lastAutoTable.finalY + 10;

  doc.setFont("helvetica", "bold").setFontSize(12);
  doc.text(`VALOR TOTAL DO ORÇAMENTO: R$ ${valorTotal.toFixed(2)}`, 14, finalY);

  enviarPDF(res, doc, `Orcamento_${o.clienteNome}.pdf`);
});

/* ===============================
   ROTA: RELATÓRIO
================================= */
app.post("/api/relatorio", (req, res) => {
  const { title = "relatorio", dados = [] } = req.body;

  const doc = new jsPDF();
  doc.setFontSize(14).text(title, 14, 14);

  if (dados.length > 0) {
    doc.autoTable({
      startY: 20,
      head: [Object.keys(dados[0])],
      body: dados.map((d) => Object.values(d))
    });
  }

  enviarPDF(res, doc, `${title}.pdf`);
});

/* ===============================
   HEALTH CHECK
================================= */
app.get("/", (_, res) => res.send("PDF API OK"));

/* ===============================
   START SERVER
================================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PDF Server running on port ${PORT}`));
