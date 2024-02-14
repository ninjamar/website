build:
	staticjinja build --outpath ./dist
clean:
	rm -rf blog projects ./dist
serve:
	python3 -m http.server 8080
dev:
	make build
	make serve