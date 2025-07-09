const express = require("express");
const bodyParser = require("body-parser");
const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;
const { format } = require("date-fns");
const path = require("path");

const app = express();
app.use(bodyParser.json());

// Sert les fichiers frontend
app.use(express.static(path.join(__dirname, "../frontend")));

app.post("/imprimer", async (req, res) => {
  const { nomClient, produits, paiement } = req.body;

  const printer = new ThermalPrinter({
    type: PrinterTypes.EPSON,
    interface: "usb", // Remplacer par "usb", "tcp://..." ou "/dev/usb/lp0" selon ton imprimante
    width: 48,
    characterSet: 'SLOVENIA',
    removeSpecialCharacters: false,
    lineCharacter: "-",
  });

  try {
    // Vérifie que l'imprimante est connectée
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) throw new Error("Imprimante non connectée");

    // ====== En-tête ======
    printer.alignCenter();
    printer.println("-------- AK PHONE SOLUTION --------");
    printer.println("AK PHONE SOLUTION");
    printer.println("14 RUE Gambetta 08200 , Sedan - FRANCE");
    printer.println("Siret: 98789929100015");
    printer.println("Tél: 0************");
    printer.drawLine();

    // ====== Client et Date ======
    const dateStr = format(new Date(), "dd/MM/yyyy HH:mm");
    printer.alignLeft();
    printer.println(`CLIENT  : ${nomClient}`);
    printer.println(`DATE    : ${dateStr}`);
    printer.drawLine();

    // ====== Liste des Produits ======
    let total = 0;
    produits.forEach(p => {
      const prixLigne = p.quantite * p.prix;
      total += prixLigne;

      printer.println(`• ${p.nom}`);
      if (p.imei) printer.println(`  IMEI : ${p.imei}`);
      printer.println(`  Qté : ${p.quantite}   Prix : ${prixLigne.toFixed(2)} €`);
      printer.drawLine();
    });

    const tva = total * 0.2;

    // ====== Totaux ======
    printer.alignRight();
    printer.println(`Sous-total : ${total.toFixed(2)} €`);
    printer.println(`TVA 20%    : ${tva.toFixed(2)} €`);
    printer.println(`TOTAL TTC  : ${total.toFixed(2)} €`);
    printer.drawLine();

    // ====== Paiement ======
    printer.println(`Paiement   : ${paiement}`);
    printer.println(`CB         : ${paiement === 'CB' ? total.toFixed(2) : '0.00'} €`);
    printer.println(`Espèces    : ${paiement === 'Espèces' ? total.toFixed(2) : '0.00'} €`);
    printer.println("Rendu      : 0.00 DA");
    printer.drawLine();

    // ====== Footer ======
    printer.alignCenter();
    printer.newLine();
    printer.println("Merci pour votre visite !");
    printer.newLine();
    printer.println("⚠️ Garantie :");
    printer.println(" - 2 ans hors casse et oxydation");
    printer.println(" - Aucun remboursement possible");
    printer.println(" - Services garantis 3 mois");

    printer.newLine();
    printer.cut();
    await printer.execute();

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur d'impression :", err);
    res.status(500).json({ error: "Erreur d'impression" });
  }
});

// Démarre le serveur
app.listen(3000, () => {
  console.log("✅ Serveur POS démarré sur http://localhost:3000");
});
