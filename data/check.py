import csv

# List of files to validate
files_to_check = [
    "nodes_directories.csv",
    "nodes_tags.csv",
    "nodes_files.csv",
    "rels_file_directory.csv",
    "rels_file_tags.csv",
]

# Validation rules for each file
validation_rules = {
    "nodes_directories.csv": ["path:ID(Directory)"],
    "nodes_tags.csv": ["name:ID(Tag)"],
    "nodes_files.csv": ["file_path:ID(File)", "content", "last_updated", "author", "version"],
    "rels_file_directory.csv": [":START_ID(File)", ":END_ID(Directory)"],
    "rels_file_tags.csv": [":START_ID(File)", ":END_ID(Tag)"],
}

# Function to validate a CSV file
def validate_csv(file_name, required_columns):
    with open(file_name, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for line_number, row in enumerate(reader, start=2):  # Start at 2 to account for the header
            for column in required_columns:
                if not row[column]:
                    print(f"Invalid row in {file_name} at line {line_number}: Missing value in column '{column}'")

# Validate each file
for file_name in files_to_check:
    if file_name in validation_rules:
        print(f"Validating {file_name}...")
        validate_csv(file_name, validation_rules[file_name])