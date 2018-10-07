echo ""
echo ""

# Generate Server Key
echo "Server Key:"
SERVER_KEY=$( head -c 10 /dev/urandom | sha1sum )
echo $SERVER_KEY

echo ""
echo ""

# Generate Client Key
echo "Client Key:"
CLIENT_KEY=$( head -c 50 /dev/urandom | sha256sum )
echo $CLIENT_KEY

echo ""
echo ""
