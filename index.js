require("dotenv").config();//não esqueça de criar o arquivo .env e configurar as variáveis

const axios = require("axios").default;//use .default caso tenha erro com axios
const crypto = require("crypto");
const WebSocket = require("ws");



// Quantidade a ser negociada e cada ordem
let qtnCompra = 4;
// Simbolo da moeda a ser negociada 
let simbolo = "XRPBRL";
// Cria uma conexão com a binance
const ws = new WebSocket(process.env.STREAM_URL +  simbolo.toLowerCase() +"@bookTicker");
// Variável que abre e fecha as ordens
let isOpened = true;
// Valor a ser vendida
let precoVenda;
// Porcentagem a ser ganhada na venda
let porcentagemGanho = 1.02;

// Método que analiza o momento de compra
ws.onmessage = async (event) => {
    // Recebe os dados vindo do WS
    const obj = JSON.parse(event.data);
    // Valor de compra
    const valorCompra = parseFloat(obj.a);
    // Se não existe uma ordem cria uma
    if (!isOpened) {
        // Preço da venda moeda
        precoVenda = valorCompra * porcentagemGanho;
        console.log("Comprar!");
        // Método que compra a moeda
        newOrder(simbolo, `${qtnCompra}`, "BUY");
        // Deixa a ordem em aberta
        isOpened = true;
    }
    // Se a ordem estiver aberta e valor compra for maior que o preco de venda, ele vende
    else if (valorCompra > precoVenda && isOpened) {
        console.log("Vender!");
        // Cria uma nova ordem de venda
        newOrder(simbolo, `${qtnCompra}`, "SELL");
        // fecha a ordem
        isOpened = false;
    }
    
}

// Método que cria uma nova ordem
async function newOrder(symbol, quantity, side) {
    // Recebe o Simbola do moeda, a quantidade a ser negociada, e o tipo de ordem( Compra ou Venda)
    const data = { symbol, quantity, side };
    // Ordem a Mercado
    data.type = "MARKET";
    // Hora Atual
    data.timestamp = Date.now();

    // Cria uma assinatura
    const signature = crypto
        .createHmac("sha256", process.env.SECRET_KEY)
        .update(new URLSearchParams(data).toString())
        .digest("hex");

        // Instancia a assinatura
        data.signature = signature;

    try {
        // Cria uma requisição com a binance
        const result = await axios({
            method: "POST",
            url: process.env.API_URL + "/v3/order?" + new URLSearchParams(data),
            headers: { "X-MBX-APIKEY": process.env.API_KEY }
        });
        //console.log(result.data);
    } catch (err) {
        console.log(err);
    }
}
