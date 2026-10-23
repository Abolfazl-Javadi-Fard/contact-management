
from getpass import getpass

from database import SessionLocal
from models import User
from security import hash_password


def main():
    db = SessionLocal()

    try:
        phone = input("شماره تلفن مدیر: ").strip()
        email = input("ایمیل مدیر (اختیاری): ").strip() or None
        password = getpass("رمز عبور مدیر: ")
        confirm = getpass("تکرار رمز عبور: ")

        if not phone:
            print("شماره تلفن الزامی است.")
            return

        if len(password) < 12:
            print("رمز عبور باید حداقل ۱۲ کاراکتر باشد.")
            return

        if password != confirm:
            print("رمزهای عبور مطابقت ندارند.")
            return

        existing = db.query(User).filter(
            (User.phone == phone)
            | (User.email == email if email else False)
        ).first()

        if existing:
            print(
                "این شماره تلفن یا ایمیل قبلاً ثبت شده است. "
                "حساب موجود را بررسی کن."
            )
            return

        admin = User(
            phone=phone,
            email=email,
            password_hash=hash_password(password),
            role="admin",
            is_active=True,
        )

        db.add(admin)
        db.commit()

        print("حساب مدیر با موفقیت ایجاد شد.")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
