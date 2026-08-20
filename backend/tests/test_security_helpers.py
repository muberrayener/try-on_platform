from app.core.security import create_access_token, decode_access_token, password_hash

def test_password_hash():
    value = password_hash.hash("VeryStrong123!")
    assert value != "VeryStrong123!"
    assert password_hash.verify("VeryStrong123!", value)
