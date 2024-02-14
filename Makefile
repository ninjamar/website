build:
	staticjinja build --outpath ./dist
	cp -r static dist
clean:
	rm -rf blog projects ./dist
serve:
	python3 -m http.server 8080
dev:
	make build
	make serve