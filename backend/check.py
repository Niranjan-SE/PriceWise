import requests

def test_api():
    url = "https://real-time-amazon-data.p.rapidapi.com/product-offers"
    
    headers = {
        "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
        "x-rapidapi-key": "c16d4786f2mshf62c31785e8de6fp17a2dfjsnbfecb18c2e52"
    }

    params = {
        "asin": "B09SM24S8C",
        "country": "US"
    }

    res = requests.get(url, headers=headers, params=params)

    if res.status_code == 200:
        print("✅ API is working")
        print(res.json())
    else:
        print("❌ Error:", res.status_code, res.text)

test_api()