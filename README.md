# MISHAP RP RADIO — version portable

## Fonctionnalités
- Un seul exécutable Windows `.exe` portable, sans assistant d'installation.
- Icône de l'application issue de `MishapRP.png`.
- PTT global utilisable lorsque l'application est réduite ou qu'une autre fenêtre est active.
- Le raccourci est celui défini dans les paramètres de la radio.
- Le mode bascule (un appui pour parler, un nouvel appui pour couper) est activé par défaut. Le mode maintien reste disponible dans les paramètres.

## Générer le fichier EXE avec GitHub
1. Dépose le contenu de ce dossier à la racine de ton dépôt GitHub.
2. Ouvre l'onglet **Actions**.
3. Lance **Build MISHAP RP RADIO portable EXE** avec **Run workflow**.
4. Télécharge l'artefact **MISHAP-RP-RADIO-Portable** : il contient le fichier `.exe`.

## Compilation locale (Windows)
Avec Node.js 20 installé, lance dans ce dossier :
```bash
npm install
npm run build:win
```
Le fichier final sera dans `release/`.

## À savoir
Le `.exe` portable ne lance pas d'assistant d'installation et peut être déplacé comme un fichier normal. Les préférences et données locales restent dans le profil Windows de l'utilisateur. La radio utilise PeerJS/WebRTC et nécessite une connexion Internet pour communiquer.
