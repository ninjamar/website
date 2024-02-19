build:
	staticjinja build --outpath ./dist
	cp -r static dist
clean:
	rm -rf blog projects ./dist
dev: # very dangerous (spans new process every time)
	staticjinja watch --outpath ./dist > /dev/null 2>&1 & 
	cp -r static dist
	fswatch static | while IFS= read -r line; do cp -r static dist; done