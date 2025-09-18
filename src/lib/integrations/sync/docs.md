# Varekortotek synkronisering med e-conomic

> [!NOTE]
> Se uptime og incident reports på [e-conomic status side](https://status.e-conomic.com/)

> [!NOTE]  
> Varetekst 3 og note felter kan ikke opdateres fra e-conomic og enhed feltet er begrænset til NemLagers enheder. Se afsnittet om enheder for mere information.

### Installer NemLager app

Før en kunde kan bruge integrationer i NemLager skal denne udvidelse aktiveres på kunden i databasen. 

For at integrerer e-conomic i NemLager, skal en superbruger af kundens e-conomic konto installere NemLagers app via. vores installationslink som kan findes i NemLager under Administration > Firma > Integrationer og klikke på "Installer" ved e-conomic.

Installationslinket vil tage kunden til en side hvor de skal klikke på "Tilføj app". Efter vil et id blive vist i en inputboks, som skal kopieres og gemmes i NemLager hvor kunden også klikkede på installationslinket.

Når dette er gjort, kan kunden klikke på "Gem" hvilket kryptere og gemmer deres information i vores database.

---

### Aktiver varekartotek synkronisering

En Skancode system administrator skal forinden have oprettet en NemLager API nøgle til kunden, som skal bruges til at authenticate webhooket og identificere NemLager kunden.

Varekartotek synkronisering benytter e-conomics webhooks funktioner. Disse skal aktiveres inde på kundens e-conomic konto under Alle indstillinger > Udvidelser > Webhooks.

Her skal kunden trykke på "Opret ny" og vælge "Vare opdateret" i type feltet og give det et navn. Til sidst skal de kopiere følgende link ind i feltet "URL":

https://lager.nemunivers.app/api/v1/webhooks/e-conomic/products?old=[OLDNUMBER]&new=[NEWNUMBER]&key={API-KEY}

> [!IMPORTANT]
> Erstat `{API-KEY}` med kundens NemLager API nøgle

Når varekartotek synkronisering slåes til, bliver der oprettet en Lamdba funktion på vores AWS konto, som laver en fuld synkronisering af kundens varekartotek en gang om dagen, da webhooks kan være ustabile til tider.

---

### Afinstaller NemLager app

Integrationen kan afinstalleres på firma administrations siden under integrations sektionen ved at klikke på "Afinstaller". 

Dette sletter kun data i NemLagers database og ikke i det eksterne system. Varekartotek forbliver som det er og kan igen opdateres fra NemLager.

> [!IMPORTANT]
> Alle integration logs forbundet med integrationen slettes fra NemLagers database

Eventuelle ressourcer oprettet i AWS slettes også når en integration afinstalleres.

---

### Enheder i varekartotek synkronisering

Da enheder er data styret af Skancode og er globalt for alle kunder, så er det opsat nogle regler for hvilke værdier denne data kan have. 

For hver enhed i NemLager er det defineret nogle "aliaser" som mapper til en enhed NemLager kender.

> #### Eksempler:
> Stk enhed kan defineres som: 'Stk', 'Stk.', 'stk', 'stk.', 'styk', 'piece', 'pieces', 'pcs', 'pcs.', 'pc', 'pc.', 'ea', 'each',
>
> Meter enhed kan defineres som: 'Meter', 'meter', 'metre', 'm', 'M', 'mt', 'mtr', 'meters', 'metres'
>
> Kg enhed kan definieres som: 'Kg', 'kg', 'KG', 'kilo', 'kilogram', 'kilos', 'kilograms'
>
> Kasse enhed kan defineres som: 'Kasse', 'kasse', 'box', 'boxes', 'case', 'cases', 'carton', 'cartons'
>
> Gram enhed kan defineres som: 'Gram', 'gram', 'g', 'G', 'gr', 'grams'
>
> Pose kan defineres som: 'Pose', 'pose', 'poser', 'bag', 'bags', 'sack', 'sacks'
>
> Plade kan defineres som: 'Plade', 'plade', 'plader', 'plate', 'plates', 'sheet', 'sheets', 'panel', 'panels', 'board', 'boards'
>
> Liter kan defineres som: 'Liter', 'liter', 'litre', 'l', 'L', 'lt', 'ltr', 'liters', 'litres'
>
> Ark kan defineres som: 'Ark', 'ark', 'sheet', 'sheets', 'leaf', 'leaves'
>
> Rulle kan defineres som: 'Rulle', 'rulle', 'roller', 'roll', 'rolls', 'reel', 'reels'
>
> Pakke kan defineres som: 'Pakke', 'pakke', 'pakker', 'pack', 'packs', 'package', 'packages', 'pkg', 'pkgs'
>
> M2 kan defineres som: 'M2', 'm2', 'M²', 'm²', 'sqm', 'SQM', 'square meter', 'square metre', 'square meters', 'square metres', 'kvadratmeter', 'kvm'
>
> Palle kan defineres som: 'Palle', 'palle', 'pallet', 'pallets', 'skid', 'skids'
>
> Sæt kan defineres som: 'Sæt', 'sæt', 'set', 'sets', 'kit', 'kits'
>
> Kolli kan defineres som: 'Kolli', 'kolli', 'parcel', 'parcels', 'shipment', 'shipments'
