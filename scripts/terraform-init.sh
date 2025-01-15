cd "$(dirname "$0")/../terraform"
docker compose run --rm terraform init
docker compose run --rm terraform apply -auto-approve