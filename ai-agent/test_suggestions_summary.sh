#!/bin/bash

BASE_URL="http://localhost:8000/api/v1/concierge"

echo "========================================="
echo "QUICK SUGGESTIONS TEST REPORT"
echo "Date: $(date)"
echo "========================================="

test_prompt() {
    local flow_type=$1
    local message=$2
    local icon=$3
    local test_num=$4
    
    echo -e "\n$icon Test $test_num: \"$message\""
    SESSION=$(curl -s -X POST "$BASE_URL/sessions" \
        -H "Content-Type: application/json" \
        -d "{\"user_id\": \"test_${flow_type}_${test_num}\", \"flow_type\": \"$flow_type\"}" | \
        python3 -c "import sys, json; print(json.load(sys.stdin).get('session_id', 'ERROR'))" 2>/dev/null)
    
    if [ "$SESSION" = "ERROR" ] || [ -z "$SESSION" ]; then
        echo "   ❌ FAILED: Could not create session"
        return
    fi
    
    RESULT=$(curl -s -X POST "$BASE_URL/sessions/$SESSION/messages" \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$message\"}" 2>/dev/null)
    
    RESPONSE=$(echo "$RESULT" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('response', 'NO RESPONSE')[:100])" 2>/dev/null)
    BUNDLE_COUNT=$(echo "$RESULT" | python3 -c "import sys, json; d=json.load(sys.stdin); print(len(d.get('bundles', [])))" 2>/dev/null)
    
    if [ -z "$BUNDLE_COUNT" ] || [ "$BUNDLE_COUNT" = "0" ]; then
        echo "   ⚠️  CLARIFICATION: $RESPONSE"
    else
        echo "   ✅ SUCCESS: $BUNDLE_COUNT results"
        echo "   📝 Response: $RESPONSE..."
    fi
}

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✈️  FLIGHT QUICK SUGGESTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_prompt "flights" "Find flights from SFO to JFK on December 15" "✈️" "1"
test_prompt "flights" "Show me flights from LAX to ATL on December 20" "✈️" "2"
test_prompt "flights" "Find cheap flights from BOS to MIA" "✈️" "3"
test_prompt "flights" "Direct flights from PHX to SEA" "✈️" "4"

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏨 HOTEL QUICK SUGGESTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_prompt "hotels" "Find hotels in New York with a pool" "🏨" "1"
test_prompt "hotels" "Budget-friendly stay in Boston" "🏨" "2"
test_prompt "hotels" "Hotels in Miami from Dec 20-25" "🏨" "3"
test_prompt "hotels" "Pet-friendly hotels in Philadelphia" "🏨" "4"

echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚗 CAR RENTAL QUICK SUGGESTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

test_prompt "cars" "Rent an SUV in New York for a week" "🚗" "1"
test_prompt "cars" "Economy car in Boston for 3 days" "🚗" "2"
test_prompt "cars" "Luxury car rental in Miami" "🚗" "3"
test_prompt "cars" "Compact car in Philadelphia" "🚗" "4"

echo -e "\n========================================="
echo "✅ TEST COMPLETE"
echo "========================================="
echo ""
echo "Legend:"
echo "  ✅ SUCCESS - Query returned results"
echo "  ⚠️  CLARIFICATION - Agent asks for more info (expected behavior)"
echo "  ❌ FAILED - Error occurred"
