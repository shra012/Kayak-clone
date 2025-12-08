#!/bin/bash

BASE_URL="http://localhost:8000/api/v1/concierge"

echo "========================================="
echo "TESTING FLIGHT QUICK SUGGESTIONS"
echo "========================================="

# Flight Test 1: Find flights from SFO to JFK on December 15
echo -e "\n✈️  Test 1: Find flights from SFO to JFK on December 15"
SESSION1=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_flight1", "flow_type": "flights"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION1/messages" -H "Content-Type: application/json" -d '{"message": "Find flights from SFO to JFK on December 15"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

# Flight Test 2: Show me flights from LAX to ATL on December 20
echo -e "\n✈️  Test 2: Show me flights from LAX to ATL on December 20"
SESSION2=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_flight2", "flow_type": "flights"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION2/messages" -H "Content-Type: application/json" -d '{"message": "Show me flights from LAX to ATL on December 20"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

# Flight Test 3: Find cheap flights from BOS to MIA
echo -e "\n✈️  Test 3: Find cheap flights from BOS to MIA"
SESSION3=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_flight3", "flow_type": "flights"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION3/messages" -H "Content-Type: application/json" -d '{"message": "Find cheap flights from BOS to MIA"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

# Flight Test 4: Direct flights from PHX to SEA
echo -e "\n✈️  Test 4: Direct flights from PHX to SEA"
SESSION4=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_flight4", "flow_type": "flights"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION4/messages" -H "Content-Type: application/json" -d '{"message": "Direct flights from PHX to SEA"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

echo -e "\n========================================="
echo "TESTING HOTEL QUICK SUGGESTIONS"
echo "========================================="

# Hotel Test 1: Find hotels in New York with a pool
echo -e "\n🏨 Test 1: Find hotels in New York with a pool"
SESSION5=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_hotel1", "flow_type": "hotels"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION5/messages" -H "Content-Type: application/json" -d '{"message": "Find hotels in New York with a pool"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

# Hotel Test 2: Budget-friendly stay in Boston
echo -e "\n🏨 Test 2: Budget-friendly stay in Boston"
SESSION6=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_hotel2", "flow_type": "hotels"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION6/messages" -H "Content-Type: application/json" -d '{"message": "Budget-friendly stay in Boston"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

# Hotel Test 3: Hotels in Miami from Dec 20-25
echo -e "\n🏨 Test 3: Hotels in Miami from Dec 20-25"
SESSION7=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_hotel3", "flow_type": "hotels"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION7/messages" -H "Content-Type: application/json" -d '{"message": "Hotels in Miami from Dec 20-25"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

# Hotel Test 4: Pet-friendly hotels in Philadelphia
echo -e "\n🏨 Test 4: Pet-friendly hotels in Philadelphia"
SESSION8=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_hotel4", "flow_type": "hotels"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION8/messages" -H "Content-Type: application/json" -d '{"message": "Pet-friendly hotels in Philadelphia"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

echo -e "\n========================================="
echo "TESTING CAR RENTAL QUICK SUGGESTIONS"
echo "========================================="

# Car Test 1: Rent an SUV in New York for a week
echo -e "\n🚗 Test 1: Rent an SUV in New York for a week"
SESSION9=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_car1", "flow_type": "cars"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION9/messages" -H "Content-Type: application/json" -d '{"message": "Rent an SUV in New York for a week"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

# Car Test 2: Economy car in Boston for 3 days
echo -e "\n🚗 Test 2: Economy car in Boston for 3 days"
SESSION10=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_car2", "flow_type": "cars"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION10/messages" -H "Content-Type: application/json" -d '{"message": "Economy car in Boston for 3 days"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

# Car Test 3: Luxury car rental in Miami
echo -e "\n🚗 Test 3: Luxury car rental in Miami"
SESSION11=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_car3", "flow_type": "cars"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION11/messages" -H "Content-Type: application/json" -d '{"message": "Luxury car rental in Miami"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

# Car Test 4: Compact car in Philadelphia
echo -e "\n🚗 Test 4: Compact car in Philadelphia"
SESSION12=$(curl -s -X POST "$BASE_URL/sessions" -H "Content-Type: application/json" -d '{"user_id": "test_car4", "flow_type": "cars"}' | python3 -c "import sys, json; print(json.load(sys.stdin)['session_id'])")
curl -s -X POST "$BASE_URL/sessions/$SESSION12/messages" -H "Content-Type: application/json" -d '{"message": "Compact car in Philadelphia"}' | python3 -c "import sys, json; d=json.load(sys.stdin); print('✓ Response:', d['response'][:150]); print('✓ Bundles:', len(d.get('bundles', [])))"

echo -e "\n========================================="
echo "✅ ALL QUICK SUGGESTIONS TESTED"
echo "========================================="
