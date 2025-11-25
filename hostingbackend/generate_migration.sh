#!/bin/bash
source venv/bin/activate
alembic revision --autogenerate -m "Add username to UserProfile model"
