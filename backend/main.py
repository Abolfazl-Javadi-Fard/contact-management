from fastapi import Body
from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, EmailStr, Field, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import or_
from security import (
    verify_password,
    create_access_token,
    decode_access_token,
    hash_password,
)
from database import Base, engine, get_db
from models import Contact, User

app = FastAPI(
    title="Contact Management API",
    description="API for managing contacts",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)

class ContactCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=20)
    email: str | None = Field(default=None, max_length=254)
    notes: str | None = None

class ContactUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    phone: str | None = Field(default=None, min_length=1, max_length=20)
    email: str | None = Field(default=None, max_length=254)
    notes: str | None = None


class UserUpdate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=20)
    email: EmailStr | None = None


class PasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=12, max_length=128)


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=1, max_length=254)
    password: str = Field(min_length=1, max_length=128)
    

class SignupRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=20)
    email: EmailStr | None = None
    password: str = Field(min_length=12, max_length=128)

    @field_validator("first_name", "last_name")
    @classmethod
    def validate_names(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("نام و نام خانوادگی نمی‌توانند خالی باشند.")
        return value

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        import re

        value = value.strip()
        if not re.fullmatch(r"09\d{9}", value):
            raise ValueError(
                "شماره موبایل باید ۱۱ رقم باشد و با 09 شروع شود."
            )
        return value

    @field_validator("email", mode="before")
    @classmethod
    def validate_email(cls, value):
        if value is None:
            return None
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return None
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("رمز عبور نمی‌تواند فقط شامل فاصله باشد.")
        return value




@app.post("/auth/signup", status_code=201)
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.scalar(
        select(User).where(
            or_(
                User.phone == data.phone,
                *(
                    [User.email == str(data.email)]
                    if data.email is not None
                    else []
                ),
            )
        )
    )
    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="این شماره تلفن یا ایمیل قبلاً ثبت شده است.",
        )

    user = User(
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        email=str(data.email) if data.email is not None else None,
        password_hash=hash_password(data.password),
        role="user",
        is_active=True,
    )

    try:
        db.add(user)
        db.flush()

        contact = Contact(
            user_id=user.id,
            first_name=data.first_name,
            last_name=data.last_name,
            phone=data.phone,
            email=str(data.email) if data.email is not None else None,
        )
        db.add(contact)
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="ثبت‌نام انجام نشد. لطفاً دوباره تلاش کنید.",
        )

    return {
        "message": "ثبت‌نام با موفقیت انجام شد.",
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "email": user.email,
            "role": user.role,
        },
    }


@app.post("/auth/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    identifier = data.identifier.strip()

    user = db.scalar(
        select(User).where(
            or_(
                User.email == identifier,
                User.phone == identifier,
            )
        )
    )

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="ایمیل، شماره تلفن یا رمز عبور اشتباه است.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="این حساب غیرفعال است.",
        )

    access_token = create_access_token(user.id)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
        },
    }
    
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials

    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except (HTTPException, ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="توکن ورود نامعتبر یا منقضی شده است.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="توکن ورود نامعتبر یا منقضی شده است.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(User, user_id)

    if not user or not user.is_active:
        raise HTTPException(
            status_code=401,
            detail="حساب کاربری معتبر نیست.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="شما اجازه دسترسی به این بخش را ندارید.",
        )

    return current_user



@app.get("/")
def read_root():
    return {"message": "Contact Management API is running!"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/auth/me")
def get_my_account(
    current_user: User = Depends(get_current_user),
):
    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "email": current_user.email,
        "role": current_user.role,
    }


@app.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="اجازه مشاهده این حساب را ندارید.",
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="کاربر پیدا نشد.",
        )

    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "email": user.email,
        "role": user.role,
    }


@app.put("/users/{user_id}")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="اجازه ویرایش این حساب را ندارید.",
        )

    user = db.get(User, user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="کاربر پیدا نشد.",
        )

    email = str(payload.email).strip() if payload.email else None
    phone = payload.phone.strip()

    if not payload.first_name.strip() or not payload.last_name.strip() or not phone:
        raise HTTPException(
            status_code=422,
            detail="نام، نام خانوادگی و شماره موبایل الزامی هستند.",
        )

    duplicate_conditions = [User.phone == phone]
    if email:
        duplicate_conditions.append(User.email == email)

    duplicate = db.scalar(
        select(User).where(
            User.id != user_id,
            or_(*duplicate_conditions),
        )
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="این شماره موبایل یا ایمیل قبلاً ثبت شده است.",
        )

    user.first_name = payload.first_name.strip()
    user.last_name = payload.last_name.strip()
    user.phone = phone
    user.email = email

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "email": user.email,
        "role": user.role,
    }


@app.post("/auth/change-password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(
        payload.current_password,
        current_user.password_hash,
    ):
        raise HTTPException(
            status_code=400,
            detail="رمز عبور فعلی اشتباه است.",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=422,
            detail="رمز عبور جدید باید با رمز فعلی متفاوت باشد.",
        )

    current_user.password_hash = hash_password(payload.new_password)

    db.commit()

    return {"message": "رمز عبور با موفقیت تغییر کرد."}


@app.get("/contacts")
def get_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Contact).where(
        Contact.deleted_flag.is_(False)
    )

    if current_user.role != "admin":
        statement = statement.where(
            Contact.user_id == current_user.id
        )

    statement = statement.order_by(Contact.id.desc())
    contacts = db.scalars(statement).all()

    return [
        {
            "id": contact.id,
            "user_id": contact.user_id,
            "first_name": contact.first_name,
            "last_name": contact.last_name,
            "phone": contact.phone,
            "email": contact.email,
            "notes": contact.notes,
            "deleted_flag": contact.deleted_flag,
            "created_at": contact.created_at,
        }
        for contact in contacts
    ]

@app.post("/contacts", status_code=201)
def create_contact(
    payload: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    contact = Contact(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        phone=payload.phone.strip(),
        email=payload.email.strip() if payload.email else None,
        notes=payload.notes,
    )

    if not contact.first_name or not contact.last_name or not contact.phone:
        raise HTTPException(
            status_code=422,
            detail="نام، نام خانوادگی و شماره تماس الزامی هستند.",
        )

    db.add(contact)
    db.commit()
    db.refresh(contact)

    return {
        "id": contact.id,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "phone": contact.phone,
        "email": contact.email,
        "notes": contact.notes,
        "deleted_flag": contact.deleted_flag,
        "created_at": contact.created_at,
    }
    
    
@app.put("/contacts/{contact_id}")
def update_contact(
    contact_id: int,
    payload: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Contact).where(
        Contact.id == contact_id,
        Contact.deleted_flag.is_(False),
    )

    if current_user.role != "admin":
        statement = statement.where(
            Contact.user_id == current_user.id
        )

    contact = db.scalar(statement)

    if contact is None:
        raise HTTPException(
            status_code=404,
            detail="مخاطب پیدا نشد.",
        )

    contact.first_name = payload.first_name.strip()
    contact.last_name = payload.last_name.strip()
    contact.phone = payload.phone.strip()
    contact.email = payload.email.strip() if payload.email else None
    contact.notes = payload.notes

    if not contact.first_name or not contact.last_name or not contact.phone:
        raise HTTPException(
            status_code=422,
            detail="نام، نام خانوادگی و شماره تماس الزامی هستند.",
        )

    db.commit()
    db.refresh(contact)

    return {
        "id": contact.id,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "phone": contact.phone,
        "email": contact.email,
        "notes": contact.notes,
        "deleted_flag": contact.deleted_flag,
        "created_at": contact.created_at,
    }
    
       
@app.patch("/contacts/{contact_id}")
def patch_contact(
    contact_id: int,
    payload: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Contact).where(
        Contact.id == contact_id,
        Contact.deleted_flag.is_(False),
    )

    if current_user.role != "admin":
        statement = statement.where(
            Contact.user_id == current_user.id
        )

    contact = db.scalar(statement)

    if contact is None:
        raise HTTPException(
            status_code=404,
            detail="مخاطب پیدا نشد.",
        )

    changes = payload.model_dump(exclude_unset=True)

    for field, value in changes.items():
        if isinstance(value, str):
            value = value.strip()

        if field in ("first_name", "last_name", "phone") and not value:
            raise HTTPException(
                status_code=422,
                detail="نام، نام خانوادگی و شماره تماس نمی‌توانند خالی باشند.",
            )

        setattr(contact, field, value)

    db.commit()
    db.refresh(contact)

    return {
        "id": contact.id,
        "first_name": contact.first_name,
        "last_name": contact.last_name,
        "phone": contact.phone,
        "email": contact.email,
        "notes": contact.notes,
        "deleted_flag": contact.deleted_flag,
        "created_at": contact.created_at,
    }
    
    
@app.delete("/contacts/{contact_id}")
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Contact).where(
        Contact.id == contact_id,
        Contact.deleted_flag.is_(False),
    )

    if current_user.role != "admin":
        statement = statement.where(
            Contact.user_id == current_user.id
        )

    contact = db.scalar(statement)

    if contact is None:
        raise HTTPException(
            status_code=404,
            detail="مخاطب پیدا نشد.",
        )

    contact.deleted_flag = True
    db.commit()

    return {
        "message": "مخاطب با موفقیت حذف شد.",
        "id": contact.id,
    }