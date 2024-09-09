if [ $# -eq 0 ]; then 
	echo "Please provide a name for database as first parameter."
	exit 1
fi

if [ -f "test-db.sql" ]; then
	rm "test-db.sql"
fi

if [ -f "test-db.db" ]; then
	rm "test-db.db"
fi

turso db shell $1 .dump > test-db.sql
dumpcode=$?
if [ $dumpcode -ne 0 ]; then
	rm "test-db.sql"
	echo "Could not create a dump of db $1. Make sure that the db name is valid, and that you are logged in."
	exit 1
fi

cat test-db.sql | sqlite3 test-db.db
createdbcode=$?
if [ $createdbcode -ne 0 ]; then
	echo "Failed to create db from test-db.sql."
	exit 1
fi

echo "Succesfully created local database copy of $1"
