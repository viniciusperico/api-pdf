import express from "express";
import cors from "cors";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { createCanvas } from "canvas";

const app = express();
app.use(cors());
app.use(express.json());

/* ==========================================================
   jsPDF precisa de um "fake window" no Node
========================================================== */
global.window = {
  document: {
    createElement: () => ({ getContext: () => createCanvas(1, 1).getContext("2d") })
  }
};

/* ===============================
   FUNÇÃO PARA FORMATAR DATAS
================================= */
const formatarData = (date, diasAdicionar = 0) => {
  const nova = new Date(date);
  nova.setDate(nova.getDate() + diasAdicionar);
  return nova.toLocaleDateString("pt-BR");
};

/* ============================================================================
   1) NOTA FISCAL - PDF
============================================================================ */
app.post("/api/nota-fiscal", (req, res) => {
  const venda = req.body;
  const doc = new jsPDF();

  // Cabeçalho
  doc.setFillColor(200, 200, 200);
  doc.rect(10, 10, 190, 25, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("NOTA FISCAL ELETRÔNICA - NF-e", 105, 25, { align: "center" });

  // Empresa
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("MiniERP LTDA", 14, 42);
  doc.text("CNPJ: 12.345.678/0001-99", 14, 48);
  doc.text("Endereço: Av. Brasil, 123 - Ivaiporã - PR", 14, 54);
  doc.text("Telefone: (43) 99999-9999 | Email: minierp@empresa.com", 14, 60);

  doc.line(14, 64, 196, 64);

  // Cliente
  doc.setFont("helvetica", "bold");
  doc.text("Destinatário:", 14, 72);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${venda.clienteNome}`, 14, 80);
  doc.text(`CPF/CNPJ: ${venda.clienteCPF || "-"}`, 14, 86);
  doc.text(`Endereço: ${venda.clienteEndereco || "-"}`, 14, 92);
  doc.text(`Telefone: ${venda.clienteTelefone || "-"}`, 14, 98);
  doc.text(`Email: ${venda.clienteEmail || "-"}`, 14, 104);

  // Dados venda
  doc.setFont("helvetica", "bold");
  doc.text("Dados da Operação:", 14, 118);
  doc.setFont("helvetica", "normal");
  doc.text(`Data de Venda: ${venda.data || "-"}`, 14, 126);
  doc.text(`Forma de Pagamento: ${venda.formaPagamento || "-"}`, 14, 132);

  // Tabela
  autoTable(doc, {
    startY: 140,
    head: [["Produto", "Qtd", "Unitário (R$)", "Desconto", "Imposto", "Total"]],
    body: [[
      venda.produto || "-",
      venda.quantidade || 0,
      (venda.valorUnitario ?? 0).toFixed(2),
      (venda.desconto ?? 0).toFixed(2),
      (venda.imposto ?? 0).toFixed(2),
      (venda.valor ?? 0).toFixed(2)
    ]],
    theme: "striped"
  });

  // Total
  const y = doc.lastAutoTable.finalY + 10;
  doc.setFont("helvetica", "bold");
  doc.text(`VALOR TOTAL: R$ ${(venda.valor ?? 0).toFixed(2)}`, 14, y);

  const pdf = doc.output();
  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from(pdf, "binary"));
});

/* ============================================================================
   2) BOLETO
============================================================================ */
app.post("/api/boleto", (req, res) => {
  const venda = req.body;
  const doc = new jsPDF();

  const venc = formatarData(new Date(), 15);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Banco 001 - Banco IFPR", 14, 20);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`Vencimento: ${venc}`, 160, 20);
  doc.text("Agência/Conta: 1234/567890", 14, 30);

  doc.setFont("courier", "bold");
  doc.setFontSize(14);
  doc.text(
    venda.linhaDigitavel || "34191.79001 01043.510047 91020.150008 7 87670000012345",
    14,
    42
  );

  doc.line(10, 48, 200, 48);

  doc.setFont("helvetica", "bold");
  doc.text("Beneficiário:", 14, 60);
  doc.setFont("helvetica", "normal");
  doc.text("MiniERP LTDA", 14, 66);
  doc.text("CNPJ: 12.345.678/0001-99", 14, 72);

  doc.setFont("helvetica", "bold");
  doc.text("Pagador:", 14, 86);
  doc.setFont("helvetica", "normal");
  doc.text(venda.clienteNome, 14, 92);
  doc.text(`CPF/CNPJ: ${venda.clienteCPF || "-"}`, 14, 98);
  doc.text(`Endereço: ${venda.clienteEndereco || "-"}`, 14, 104);

  doc.setFont("helvetica", "bold");
  doc.text("Valor do Documento:", 150, 92);
  doc.text("R$ " + (venda.valor ?? 0).toFixed(2), 150, 98);

  // Código de barras fake
  doc.setFont("courier", "bold");
  doc.setFontSize(22);
  doc.text("|||| ||| |||| ||| || ||| ||||| || |||", 14, 160);

  const pdf = doc.output();
  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from(pdf, "binary"));
});

/* ============================================================================
   3) ORÇAMENTO
============================================================================ */
app.post("/api/orcamento", (req, res) => {
  const orc = req.body;

  const doc = new jsPDF();

  doc.setFillColor(100, 149, 237);
  doc.rect(10, 10, 190, 25, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ORÇAMENTO", 105, 25, { align: "center" });

  // Empresa
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("MiniERP LTDA", 14, 42);
  doc.text("CNPJ: 12.345.678/0001-99", 14, 48);
  doc.text("Endereço: Av. Brasil, 123 - Ivaiporã - PR", 14, 54);
  doc.text("Telefone: (43) 99999-9999 | Email: minierp@empresa.com", 14, 60);

  doc.line(14, 64, 196, 64);

  // Cliente
  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", 14, 72);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${orc.clienteNome}`, 14, 80);
  doc.text(`CPF/CNPJ: ${orc.clienteCPF || "-"}`, 14, 86);
  doc.text(`Endereço: ${orc.clienteEndereco || "-"}`, 14, 92);

  // Info orçamento
  doc.setFont("helvetica", "bold");
  doc.text("Informações do Orçamento:", 14, 118);
  doc.setFont("helvetica", "normal");
  doc.text(`Data: ${orc.data || "-"}`, 14, 126);
  doc.text(`Validade: ${orc.validade || "30 dias"}`, 14, 132);

  autoTable(doc, {
    startY: 140,
    head: [["Produto/Serviço", "Qtd", "Unitário", "Desconto", "Imposto", "Total"]],
    body: orc.itens.map(i => [
      i.nome,
      i.quantidade,
      i.valorUnitario.toFixed(2),
      i.desconto.toFixed(2),
      i.imposto.toFixed(2),
      i.total.toFixed(2)
    ]),
    theme: "striped"
  });

  const y = doc.lastAutoTable.finalY + 10;
  const total = orc.itens.reduce((s, i) => s + i.total, 0);

  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: R$ ${total.toFixed(2)}`, 14, y);

  const pdf = doc.output();
  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from(pdf, "binary"));
});

/* ============================================================================
   START SERVER
============================================================================ */
app.get("/", (req, res) => res.send("PDF API OK 🎉"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
