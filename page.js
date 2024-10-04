const express = require('express');
const sql = require("mssql");
const bodyParser = require('body-parser');


const config={
    server:"DESKTOP-DU8SFGO",
    database:"ExamProjectt",
    driver:"msnodesqlv8",
    user:"sa",
    password:"fati",
    options:{
        trustServerCertificate: true
    }
}

sql.connect(config,(err)=>{
    if(err)
        return console.log("Echec de la connexion a la base de donnees", err)
    console.log("connexion reussie")

})

const app = express();
const port = 3000;

// Utilisez bodyParser.urlencoded({ extended: false }) pour traiter les données du formulaire
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// static files
app.use(express.static('css'))

//changing file
app.set('html', './html')

app.get('/', (req, res)=>{
    res.sendFile(__dirname + '/html/page.html')
})

app.get('/ordre', (req, res)=>{
    res.sendFile(__dirname + '/html/ordre.html')
})
 
app.post('/ordre',(req,response)=>{
    console.log(req.body)
    
    var DiagnosticPanne = req.body.DiagnosticPanne;
    var NbHeuresMO = parseFloat(req.body.NbHeuresMO);
    var IDApp = parseInt(req.body.IDApp);
    
    var requete = `INSERT INTO ORDREREPARATION VALUES ('${DiagnosticPanne}', ${NbHeuresMO}, ${IDApp})`;
    sql.query(requete,(err,res)=>{
        if(err)
           return console.log("Erreur dans l'insertion des donnees", err);

        console.log("insertion avec succes");
    })
})

app.get('/chercher', (req, res)=>{
    res.sendFile(__dirname + '/html/chercher.html')
})

app.post('/chercherr', (req, response)=>{
    console.log(req.body)

    var search_name = req.body.search;
    requete = `SELECT * FROM CLIENTE WHERE NomCli = '${search_name}'`;
    sql.query(requete, (err, res)=>{
        if (res && res.length > 0) {
            response.redirect('/chercher');
        } else {
            const posts = res.recordset
            console.log(posts)
                const htmlTable = `
                <head>
                   <link rel="stylesheet" type="text/css" href="/myCss.css">
                </head>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nom</th>
                            <th>Adresse</th>
                            <th>Ville</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${posts.map(element => `
                            <tr>
                                <td>${element.IDCli}</td>
                                <td>${element.NomCli}</td>
                                <td>${element.AdrCli}</td>
                                <td>${element.VilleCli}</td>
                            </tr>`).join('')}
                    </tbody>
                </table>`;
            response.send(htmlTable);
        }response.end();      
    })
})


app.get('/prix', (req, response)=>{
    response.sendFile(__dirname + '/html/prix.html')

})

app.post('/prix', (req, response)=>{
    
    const searchPiece = req.body.searchePiece;
    
    requete = ` select * from PIECE where PUHT > ${searchPiece}`;
    sql.query(requete,(err,res)=>{
        if(res && res.lenght>0){
           response.redirect('/prix')
        }else{
            const posts = res.recordset
            console.log(posts)
            let htmlTable = `
          <html>
             <head>
               <link rel="stylesheet" type="text/css" href="/myCss.css">
             </head>
             <body>
             <table>
                    <thead>
                        <tr>
                            <th>IDPiece</th>
                            <th>DescPiece</th>
                            <th>PUHT</th>  
                        </tr>
                    </thead>
                    <tbody>
                    ${posts.map(element=>
                     ` 
                        <tr>
                          <td> ${element.IDPiece}</td>
                          <td> ${element.DescPiece}</td>
                          <td> ${element.PUHT}</td>  
                        </tr>
                        `
                    ).join('')}
                    </tbody>
             </body>
          </html>
        `
        response.send(htmlTable);
        } response.end();
    })
})

/*
select ord.IDOrdre, ord.DiagnosticPanne, ord.NbHeuresMO, ord.IDApp from ORDREREPARATION ord
    join PIECESACHANGER pie on pie.IDOrdre = ord.IDOrdre
    where pie.IDOrdre = ord.IDOrdre and pie.Quantite = 0
*/
app.get('/afficheOrdre', (req,response)=>{

    const requete =`SELECT ord.IDOrdre, ord.DiagnosticPanne, ord.NbHeuresMO, ord.IDApp
    FROM ORDREREPARATION ord
    WHERE NOT EXISTS (
        SELECT 1
        FROM PIECESACHANGER pie
        WHERE pie.IDOrdre = ord.IDOrdre AND pie.Quantite <> 0
    );
    ;`
    sql.query(requete, (err, res)=>{
        if(res && res.lenght>0){

        }else{
            const posts = res.recordset
            console.log(posts)
            const htmlTable = `
            <html>
            <head>
            <link rel="stylesheet" type="text/css" href="/myCss.css">
            </head>
             <body>
             <table>
                    <thead>
                        <tr>
                            <th>IDOrdre</th>
                            <th>DiagnosticPanne</th>
                            <th>NbHeuresMO</th>
                            <th>IDApp</th>
                            
                        </tr>
                    </thead>
                    <tbody>
                    ${posts.map(element=>
                     ` 
                        <tr>
                          <td> ${element.IDOrdre}</td>
                          <td> ${element.DiagnosticPanne}</td>
                          <td> ${element.NbHeuresMO}</td>  
                          <td> ${element.IDApp}</td>
                        </tr>
                        `
                    ).join('')}
                    </tbody>
             </body>
          </html>
            `
        response.send(htmlTable);
        }
        response.end();
    })

})
app.get('/facture', (req, response)=>{
    response.sendFile(__dirname + '/html/facture.html')

})

app.post('/facture',(req, response)=>{

    console.log(req.body)
    const IDAppareil = req.body.IDAppareil;
    requete=`select
    Cli.NomCli, 
    Cli.AdrCli, 
    App.DescApp, 
    Cat.libCat, 
    ord.DiagnosticPanne,
    SUM(pie.Quantite * piece.PUHT) + MAX(Cat.TarifMO) AS PrixEssentiel,
    (SUM(pie.Quantite * piece.PUHT) + MAX(Cat.TarifMO))*0.20 AS TVA,
    (SUM(pie.Quantite * piece.PUHT) + MAX(Cat.TarifMO)) + 
    (SUM(pie.Quantite * piece.PUHT) + MAX(Cat.TarifMO)) * 0.20 AS TotalAvecTVA

from APPAREIL App  
join ORDREREPARATION ord on ord.IDApp = App.IDApp
join PIECESACHANGER pie on pie.IDOrdre = ord.IDOrdre
JOIN PIECE piece on piece.IDPiece = pie.IDPiece
join CLIENTE Cli on App.IDCli = Cli.IDCli
join CATEGORIE Cat on Cat.IDCat = App.IDCat
where App.IDApp =${IDAppareil}

group by
Cli.NomCli, 
Cli.AdrCli, 
App.DescApp, 
Cat.libCat, 
ord.DiagnosticPanne;`;
    sql.query(requete,(err, res)=>{
        if(res && res.lenght>0){

        }else{
       posts = res.recordset;
       console.log(posts)
       const htmlTable = `
       <html>
             <head>
               <link rel="stylesheet" type="text/css" href="/myCss.css">
             </head>
             <body>
             <table>
                    <thead>
                        <tr>
                            <th>Nom du Client</th>
                            <th>Adresse du Client</th>
                            <th>Description de l'appareil</th>
                            <th>Categorie de l'appareil</th>
                            <th>Diagnostic du Panne</th>
                            <th>Montant brute</th>
                            <th>TVA montant</th>
                            <th>Montant Total</th>
                            
                        </tr>
                    </thead>
                    <tbody>
                    ${posts.map(element=>
                     ` 
                        <tr>
                          <td> ${element.NomCli}</td>
                          <td> ${element.AdrCli}</td>
                          <td> ${element.DescApp}</td>  
                          <td> ${element.libCat}</td>
                          <td> ${element.DiagnosticPanne}</td>
                          <td> ${element.PrixEssentiel}</td>
                          <td> ${element.TVA}</td>
                          <td> ${element.TotalAvecTVA}</td>
                        </tr>
                        `
                    ).join('')}
                    </tbody>
             </body>
          </html>
       `
       response.send(htmlTable);
    }
       response.end() ;
    })

})


app.listen(port,()=>{
    console.info('listening on port',port)
})