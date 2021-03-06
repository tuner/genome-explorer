% Generated by roxygen2: do not edit by hand
% Please edit documentation in R/GenomeSpy.R
\name{GenomeSpy}
\alias{GenomeSpy}
\title{Creates a Genome Spy}
\usage{
GenomeSpy(genome, width = "100\%", height = "auto", elementId = NULL)
}
\arguments{
\item{genome}{Genome assembly to use. Valid values are hg19 and hg38. Instead of the
name of the assembly, a cytobands data frame can be provided instead. See \code{\link{readCytobands}}.}
}
\description{
Creates a Genome Spy for the given genome assembly.
}
\author{
Kari Lavikka, \email{kari.lavikka@helsinki.fi}
}
