from app.core.security import create_access_token, decode_access_token, password_hash
from app.api.v1.garments import out

def test_password_hash():
    value = password_hash.hash("VeryStrong123!")
    assert value != "VeryStrong123!"
    assert password_hash.verify("VeryStrong123!", value)


def test_garment_output_includes_image_url():
    garment_id = "64d9c5d1b9b7e2a99d1a1234"
    payload = {
        "_id": garment_id,
        "name": "Mavi Ceket",
        "category": "upper_body",
        "active": True,
        "image_key": "users/u1/garments/64d9c5d1b9b7e2a99d1a1234"
    }

    item = out(payload)

    assert item["id"] == garment_id
    assert item["image_url"] == "/api/v1/garments/64d9c5d1b9b7e2a99d1a1234/image"
