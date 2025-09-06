# sc-copilot

> Système d’import et de modélisation de données Fintech pour Neo4j

---

## 📁 Structure du projet

```
sc-copilot/
│
├── data/
│   ├── nodes_directories.csv
│   ├── nodes_files.csv
│   ├── nodes_tags.csv
│   ├── rels_file_directory.csv
│   ├── rels_file_tags.csv
│   ├── import.cypher
│   └── ...
│
├── smart-copilot-backend/
│   └── utils/
│       ├── rel_dir.py
│       ├── rel_tag.py
│       ├── duplicate_tags.py
│       └── ...
│
└── README.md
```

---

## 🚀 Fonctionnalités

- **Modélisation des fichiers, répertoires et fonctions/tags**
- **Scripts Python pour générer et nettoyer les relations**
- **Import optimisé dans Neo4j via Cypher**
- **Gestion des contraintes et indexation**

---

## ⚙️ Installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/mibegerard/copilot.git
   cd copilot
   ```

2. **Installer Neo4j**  
   [Télécharger Neo4j](https://neo4j.com/download/) et lancer un serveur local.

3. **Installer Python 3**  
   (Recommandé : Python ≥ 3.8)

---

## 🛠️ Utilisation des scripts

### Générer les relations fichiers/répertoires
```bash
python3 smart-copilot-backend/utils/rel_dir.py
```

### Générer les relations fichiers/tags
```bash
python3 smart-copilot-backend/utils/rel_tag.py
```

### Nettoyer les doublons dans les relations
```bash
python3 smart-copilot-backend/utils/duplicate_tags.py
```

---

## 🗄️ Import dans Neo4j

1. Ouvrir Neo4j Browser ou Neo4j Desktop.
2. Charger le script Cypher :
   - Ouvrir `data/import.cypher`
   - Exécuter le script pour importer les données et les relations.

---

## 📚 Fichiers principaux

- **nodes_directories.csv** : Liste des répertoires logiques
- **nodes_files.csv** : Liste des fichiers de code
- **nodes_tags.csv** : Fonctions/tags extraits des fichiers
- **rels_file_directory.csv** : Relations fichier → répertoire
- **rels_file_tags.csv** : Relations fichier → tag/fonction
- **import.cypher** : Script d’import Neo4j

---

## 📝 Contribuer

Les contributions sont les bienvenues !  
Merci de proposer vos améliorations via des pull requests ou issues.

---

## 📄 Licence

MIT

---

## 👤 Auteur

**mibegerard**

---
