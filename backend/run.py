from dotenv import load_dotenv

from backend.app.interfaces.http.app_factory import create_app

load_dotenv()


app = create_app()


if __name__ == '__main__':
    app.run(debug=True)
