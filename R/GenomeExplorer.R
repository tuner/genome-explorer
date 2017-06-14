#' Creates a Genome Explorer
#'
#' Creates a Genome Explorer for the given genome assembly.
#' 
#' @param genome Genome assembly to use. Valid values are hg19 and hg38. Instead of the
#'   name of the assembly, a cytobands data frame can be provided instead. See \code{\link{readCytobands}}.
#'
#' @import htmlwidgets
#'
#' @author Kari Lavikka, \email{kari.lavikka@@helsinki.fi}
#' 
#' @export
GenomeExplorer <- function(genome, width = "100%", height = "auto", elementId = NULL) {
  if (is.character(genome)) {
    if (grepl("hg[0-9]+", genome)) {
      f <- system.file("extdata", paste0("cytoBand.", genome, ".txt"), package = "GenomeExplorer")
      if (!file.exists(f)) {
        stop("Cytoband data for the given genome assembly is not bundled with Genome Explorer. Please provide a cytoband data frame instead.")
      }
      cytobands <- readCytobands(f)
      
    } else {
      stop("Invalid genome assembly. Try hg19 or hg38, for example.")
    }
    
  } else if (is.data.frame(genome)) {
    # TODO: Check that the data frame contains cytobands
    cytobands <- genome
  }

  # forward options using x
  x = list(
    genome = ifelse(is.character(genome), genome, NA), # Not used at JavaScript side
    cytobands = cytobands,
	  tracks = list(),
    annotations = list()
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'GenomeExplorer',
    x,
    width = width,
    height = height,
    package = 'GenomeExplorer',
    elementId = elementId
  )
}

#' Reads a cytobands file into a data frame
#'
#' This function can be used to load a cytoband file for a genome assembly
#' that is not supported out of the box by the GenomeExplorer. A loaded
#' data frame can be fed to GenomeExplorer instead of a name of a genome assembly.
#' 
#' An example of a cytoband file:
#' http://hgdownload.cse.ucsc.edu/goldenpath/hg19/database/cytoBand.txt.gz
#'
#' Cytoband files for some genome assemblies are included in the extdata directory
#'
#' @param file Path to the cytoband file
#' 
#' @export
readCytobands <- function(file) {
  read.table(
    file,
    sep = "\t", header = FALSE,
    col.names = c("chrom", "start", "end", "name", "gieStain")
  )
}

#' Adds a segment track to Genome Explorer
#' 
#' A segment is a region in a chromosome. It has start and end coordinates, which are
#' indexed in UCSC style 1-indexed closed ranges.
#' 
#' A segment track uses a user-defined method for visualizing arbitrary columns
#' in the data. Currently supported methods are \code{\link{simpleVis}} and \code{\link{cnvVis}}.
#' 
#' @param ge A GenomeExplorer instance.
#' @param data A data frame that contains the segments being visualized.
#' @param discriminator An optional discriminator column that is used for
#'   spreading the data (cases) to subtracks.
#' @param chrom The column containing the name of the chromosome.
#' @param start The column containing the start coordinate of the genomic region.
#' @param end The column containing the end coordinate of the genomic region.
#' @param samples An optional vector that specifies the order of the samples.
#'   By default the samples are ordered alphabetically.
#' @param sampleLabels An optional vector that specifies replacement labels
#'   for the samples.
#' @param vis Visualization to use. By default an unconfigured "simple" visualization
#'   is used.
#' @param title Title of the track.
#' @param subtrackSize Subtrack thickness (height) in pixels.
#' @param subtrackPadding Padding between the subtracks in proportion to thickness.
#' 
#' @return The same GenomeExplorer instance that was passed in
#' 
#' @examples
#' segmentTrack(
#'   ge
#'   data,
#'   discriminator = "patient",
#'   vis = simpleVis(color = "type")
#' )
#' 
#' @export
segmentTrack <- function(ge, data, discriminator = NULL,
                      chrom = "chrom", start = "start", end = "end",
                      samples = NULL, sampleLabels = NULL,
                      vis = simpleVis(),
                      title = NULL,
                      subtrackSize = 30, subtrackPadding = 0.2) {
  
  # TODO: Figure out a way to do this automatically:
  x <- list(
    data = data,
    discriminator = discriminator,
    chrom = chrom,
    start = start,
    end = end,
    samples = samples,
    sample_labels = sampleLabels,
    vis = vis,
    title = title,
    subtrack_size = subtrackSize,
    subtrack_padding = subtrackPadding
  )

  ge$x$tracks <- append(ge$x$tracks, list(x))

  ge
}

#' Creates a configuration for "simple" visualization
#'
#' A simple visualization fills the segments with a color based on a variable.
#' The variable can be either continuous (numeric) or categorial (non-numeric).
#' Continuous variables are mapped to a color from a gradient. Color for
#' categorial variables are picked from a color palette. Sensible default
#' gradients and palettes are provided, but they can be overriden.
#' 
#' @param color The name of the variable that is used for color mapping.
#'   By default a default color is used for all segments.
#'   
#' @param domain An optional domain. By default the domain is obtained from
#'   the data.
#'   
#'   The domain for a continuous variable is passed as a vector
#'   that contains the minimum and maximum values. For categorial variables
#'   the vector should contain all categories.
#'   
#'   This option is particularly useful in a Shiny application where the data
#'   is filtered and the domain might change. Static domain prevents the color
#'   mapping from going awry.
#'
#' @param colorPalette An optional color palette. The palette is a vector
#'   of #RRGGBB values, which can be be provided inline or obtained from
#'   RColorBrewer, for example.
#'   
#'   For continuous variables the palette must contain at least two colors -
#'   one for the minimum value and another for the maximum value. A smooth
#'   gradient is interpolated between those values. An arbitrary number of
#'   intermediate colors can be provided for more expressiveness.
#'   
#'   For categorial variables the colors are discrete and are mapped to
#'   different categories in the same order as they are in the domain.
#'   If the number of categories exceeds the number of colors, the colors
#'   are re-used from the beginning.
#'  
#' @return A configuration for the simple visualization
#' 
#' @examples
#' simpleVis("score", domain = c(0, 50))
#' simpleVis("type",
#'           domain = c("nonsynonymous", "synonymous", "stopgain", "stoploss")
#'           colorPalette = c("#E41A1C", "#377EB8", "#4DAF4A", "#984EA3"))
#' simpleVis("type", colorPalette = RColorBrewer::brewer.pal(4, "Set1"))
#' 
#' @export
simpleVis <- function(color = NULL, domain = NULL, colorPalette = NULL) {
  list(
    type = "simple",
    config = list(
      color = color,
      domain = domain,
      colorPalette = colorPalette
    )
  )
}

#' Creates a configuration for "Copy number variation" visualization
#'
#' Both of the parameters \code{seg} and \code{baf} are optional, but leaving
#' both empty is pointless.
#' 
#' @param seg Name of the segment mean variable
#' @param baf Name of the B allele frequency variable
#' 
#' @return A configuration for the cnv visualization
#' 
#' @export
cnvVis <- function(seg = NULL, baf = NULL) {
  list(
    type = "cnv",
    config = list(
      seg = seg,
      baf = baf
    )
  )
}

#' Adds a refseq gene annotation track to Genome Explorer
#'
#' @param refseq_genes_compressed A URL to "delta compressed" refseq genes. See utils/compressRefGene.py
#' 
#'   The server must allow cross origin requests by including the following HTTP header in responses:
#'   \code{Access-Control-Allow-Origin: *}
#'   
#'   If the URL is omitted, the genome data will be loaded from karilavikka.fi.
#'   
#' @export
refseqGeneTrack <- function(ge, refseq_genes_compressed = NULL) {
  # TODO: Support multiple gene tracks
  
  if (is.character(refseq_genes_compressed)) {
    url <- refseq_genes_compressed
    
  } else if (is.character(ge$x$genome)) {
    url = paste0("https://karilavikka.fi/genome-explorer/annotations/refSeq_genes.", ge$x$genome, ".compressed.txt")
    
  } else {
    stop("No genome assembly nor a URL to annotation data has been provided!")
  }
  
  ge$x$annotations <- append(ge$x$annotations, list(refseq_genes_compressed = url))
  
  ge
}

#' Searches a cytoband, chromosome or a refseq gene.
#' 
#' Search accepts the same search keywords and formats as the search field in
#' the user interface.
#' 
#' Gene search is only available if gene annotation track has been added to the
#' explorer.
#' 
#' @param ge A GenomeExplorer instance
#' @param search The search keyword
#' 
#' @examples
#' search(ge, "tp53")
#' search(ge, "14q32")
#' 
#' @export
search <- function(ge, search) {
  print(search)
  ge$x$zoom$search <- search
  
  ge
}

#' Zooms into the specified region
#' 
#' @param ge A GenomeExplorer instance
#' @param startChrom,endChrom A chromosome
#' @param startPos,endPos A position within the chromosome
#' 
#' @examples
#' zoom(ge, "chr2", 123456, "chr4", 34567890)
#' 
#' @export
zoom <- function(ge, startChrom, startPos, endChrom, endPos) {
  # Zoom is actually just a convenience method for search
  ge <- search(ge, sprintf("%s:%d-%s:%d", startChrom, startPos, endChrom, endPos))
  
  ge
}
  
#' Shiny bindings for GenomeExplorer
#'
#' Output and render functions for using GenomeExplorer within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a GenomeExplorer
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name GenomeExplorer-shiny
#'
#' @export
GenomeExplorerOutput <- function(outputId, width = '100%', height = 'auto'){
  htmlwidgets::shinyWidgetOutput(outputId, 'GenomeExplorer', width, height, package = 'GenomeExplorer')
}

#' @rdname GenomeExplorer-shiny
#' @export
renderGenomeExplorer <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, GenomeExplorerOutput, env, quoted = TRUE)
}

.onLoad <- function(libname, pkgname) {
  shiny::registerInputHandler("GenomeExplorerRange", function(data, ...) {
    #jsonlite::fromJSON(jsonlite::toJSON(data, auto_unbox = TRUE))
    data
  }, force = TRUE)
}

.onUnload <- function(libname) {
  shiny::removeInputHandler("GenomeExplorerRange")
}
