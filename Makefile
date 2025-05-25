run:
	docker build -t meet-the-cast .
	docker run -p "8888:80" meet-the-cast
