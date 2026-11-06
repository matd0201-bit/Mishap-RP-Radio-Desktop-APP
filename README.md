# MISHAP RP RADIO V3.1.1 — Portable Windows

Projet Electron pour générer une application Windows portable en un seul fichier `.exe` (sans installateur).

## Générer le `.exe` avec GitHub Actions

1. Décompresser le dossier `MISHAP-RP-RADIO-PORTABLE`.
2. Copier **le contenu** de ce dossier à la racine du dépôt GitHub.
3. Envoyer les fichiers sur la branche `main`.
4. Ouvrir l'onglet **Actions**.
5. Lancer **Build MISHAP RP RADIO portable EXE** (ou attendre le déclenchement automatique après un push).
6. Télécharger l'artefact `MISHAP-RP-RADIO-Portable` à la fin du workflow. Il contient le fichier `.exe` portable.

## PTT

- Au premier plan : le clavier est traité par la page radio.
- En arrière-plan : le raccourci est capturé globalement par Windows via `uiohook-napi`.
- Le mode « appui pour parler / nouvel appui pour couper » est sélectionné par défaut. Le mode maintien reste disponible dans les paramètres.
- La touche et le mode sélectionnés sont synchronisés avec le processus Electron.

## Mise à jour V3.1.1

- Ajout des statuts Traffic Stop et Retour Station, et correction de « En Route ».
- Harmonisation des couleurs de statut : vert (Disponible), rouge (Indisponible), orange (Occupé), bleu (autres statuts). Les boutons de sélection restent neutres.
- Les modifications du profil ne sont appliquées qu’après clic sur « Sauvegarder ».
- Ajout d’un filtre de date au journal des transmissions ; seules les dates contenant des messages sont proposées.
- Les transmissions restent conservées localement dans IndexedDB sur chaque appareil. Il n’y a pas de sauvegarde centrale partagée.

## À savoir

- Aucun installateur n'est créé : la cible est `portable`.
- Les réglages locaux sont conservés dans le profil utilisateur Windows.
- La radio a toujours besoin d'une connexion Internet pour ses fonctions réseau (PeerJS/WebRTC).
- Le PTT global dépend des permissions et du bon démarrage du module clavier natif Windows.
