import asyncio
import asyncpg
import os
import sys
from dotenv import load_dotenv
import re
from urllib.parse import unquote

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

async def create_database_if_not_exists():
    print(f"{BLUE}Checking database existence...{RESET}")
    
    load_dotenv()
    db_url = os.getenv("DATABASE_URL", "")
    
    if not db_url:
        print(f"{RED}DATABASE_URL not found in environment variables{RESET}")
        sys.exit(1)

    # Parse connection details
    match = re.match(r'postgresql\+asyncpg://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
    if not match:
        # Try standard postgresql:// format just in case
        match = re.match(r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', db_url)
        
    if not match:
        print(f"{RED}Invalid DATABASE_URL format{RESET}")
        sys.exit(1)

    user, password, host, port, database = match.groups()
    password = unquote(password)
    port = int(port)

    # Bypass pgbouncer for database creation
    if host == 'pgbouncer':
        print(f"{YELLOW}Detected pgbouncer, switching to 'db' host for creation...{RESET}")
        host = 'db'

    # Connect to 'postgres' database to check/create target db
    try:
        conn = await asyncpg.connect(
            user=user,
            password=password,
            database='postgres',
            host=host,
            port=port
        )
    except Exception as e:
        print(f"{YELLOW}Failed to connect to 'postgres' db: {e}. Trying 'template1'...{RESET}")
        try:
            conn = await asyncpg.connect(
                user=user,
                password=password,
                database='template1',
                host=host,
                port=port
            )
        except Exception as e2:
            print(f"{RED}Failed to connect to postgres server (postgres and template1): {e2}{RESET}")
            sys.exit(1)

    try:
        # Check if database exists
        exists = await conn.fetchval("SELECT 1 FROM pg_database WHERE datname = $1", database)
        
        if not exists:
            print(f"{YELLOW}Database '{database}' does not exist. Creating...{RESET}")
            # Close connection to create new one? No, create database cannot run inside transaction block
            # asyncpg connect doesn't start transaction by default, but let's be safe
            await conn.execute(f'CREATE DATABASE "{database}"')
            print(f"{GREEN}Database '{database}' created successfully!{RESET}")
        else:
            print(f"{GREEN}Database '{database}' already exists.{RESET}")
            
    except Exception as e:
        print(f"{RED}Error checking/creating database: {e}{RESET}")
        sys.exit(1)
    finally:
        await conn.close()

if __name__ == "__main__":
    try:
        asyncio.run(create_database_if_not_exists())
    except Exception as e:
        print(f"{RED}Unexpected error: {e}{RESET}")
        sys.exit(1)
